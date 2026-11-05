import * as OBC from "@thatopen/components";
import type * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { EditRequestType, GeomsFbUtils, RenderedFaces } from "@thatopen/fragments";

const WORKER_URL = `${import.meta.env.BASE_URL}engine/worker.mjs`;
const WASM_PATH = `${location.origin}${import.meta.env.BASE_URL}engine/`;

const SELECT_MAT = {
  color: new THREE.Color("#a100ff"),
  renderedFaces: RenderedFaces.TWO,
  opacity: 1,
  transparent: false,
};

/**
 * Encapsula o setup do That Open Components: mundo 3D, loader de IFC e
 * FragmentsManager. Uma instância = um viewport.
 */
export class Viewer {
  private elementBases = new WeakMap<FRAGS.FragmentsModel, Map<number, {guid:string; raw:FRAGS.RawGlobalTransformData}>>();
  private elementMatrices = new WeakMap<FRAGS.FragmentsModel, Map<number,THREE.Matrix4>>();
  readonly components = new OBC.Components();
  fragments!: OBC.FragmentsManager;
  world!: OBC.SimpleWorld<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>;
  /** Modelo ativo: o último carregado, ou o clicado no viewport (ver pickAt). */
  model?: FRAGS.FragmentsModel;
  private grid?: OBC.SimpleGrid;
  private baseMatrices=new WeakMap<FRAGS.FragmentsModel,THREE.Matrix4>();
  gridElevation = 0;
  private _highlighted = new Map<FRAGS.FragmentsModel, number[]>();
  private _themes: {model:FRAGS.FragmentsModel;ids:number[];color:string}[]=[];
  private layers(model:FRAGS.FragmentsModel,ids:number[]):{model:FRAGS.FragmentsModel;ids:number[]}[]{
    const parent=model.isDeltaModel?this.fragments.list.get(model.parentModelId??'')??model:model;
    const result=[{model:parent,ids}];
    const child=parent.deltaModelId?this.fragments.list.get(parent.deltaModelId):undefined;
    const moved=this.elementMatrices.get(parent);
    if(child&&moved){const childIds=ids.filter(id=>moved.has(id));if(childIds.length)result.push({model:child,ids:childIds});}
    return result;
  }
  async setManagementColors(rows:{model:FRAGS.FragmentsModel;ids:number[];color:string}[]){
    for(const row of this._themes)for(const layer of this.layers(row.model,row.ids))await layer.model.resetHighlight(layer.ids);
    this._themes=rows;
    for(const row of rows)for(const layer of this.layers(row.model,row.ids))await layer.model.highlight(layer.ids,{...SELECT_MAT,color:new THREE.Color(row.color)});
    for(const [model,ids] of this._highlighted)await model.highlight(ids,SELECT_MAT);
    await this.fragments.core.update(true);
  }

  async init(viewport: HTMLElement) {
    const worlds = this.components.get(OBC.Worlds);
    const world = worlds.create<
      OBC.SimpleScene,
      OBC.SimpleCamera,
      OBC.SimpleRenderer
    >();

    world.scene = new OBC.SimpleScene(this.components);
    world.scene.setup();
    world.scene.three.background = new THREE.Color("#f4f2f8");
    world.renderer = new OBC.SimpleRenderer(this.components, viewport);
    world.renderer.showLogo = false;
    world.camera = new OBC.SimpleCamera(this.components);
    await world.camera.controls.setLookAt(30,20,30,0,0,0,false);
    this.world = world;
    new ResizeObserver(()=>{world.renderer?.resize();world.camera.updateAspect();}).observe(viewport);

    this.components.init();
    this.grid = this.components.get(OBC.Grids).create(world);

    // Worker Fragments empacotado localmente para a versão fixada do motor.
    const response = await fetch(WORKER_URL);
    if (!response.ok) throw new Error('Worker BIM local indisponível.');
    const blob = await response.blob();
    const workerUrl = URL.createObjectURL(
      new File([blob], "worker.mjs", { type: "text/javascript" }),
    );
    const fragments = this.components.get(OBC.FragmentsManager);
    fragments.init(workerUrl);
    this.fragments = fragments;

    world.camera.controls.addEventListener("update", () =>
      fragments.core.update(),
    );
    fragments.list.onItemSet.add(({ value: model }) => {
      model.useCamera(world.camera.three);
      world.scene.three.add(model.object);
      this.model = model;
      fragments.core.update(true);
    });

    const ifcLoader = this.components.get(OBC.IfcLoader);
    // autoSetWasm:false é obrigatório. Com ele ligado (default), o loader busca
    // o package.json PUBLICADO do @thatopen/components e usa o peerDep web-ifc
    // de lá (0.0.66) — que não bate com o glue instalado (0.0.77) e quebra o
    // WASM ("Import #0 'a'"). Fixamos o path na versão local. Roda em setup() E
    // load(), então só passar `path` não basta; precisa desligar o auto.
    await ifcLoader.setup({
      autoSetWasm: false,
      wasm: { absolute: true, path: WASM_PATH },
    });
  }

  async loadIfc(bytes: Uint8Array, name: string) {
    const ifcLoader = this.components.get(OBC.IfcLoader);
    const previous = this.model;
    const before = new Set(this.fragments.list.keys());
    try {
      await ifcLoader.load(bytes, true, name);
      // Reabertura em guia de fundo não deve esperar uma animação de câmera.
      await this.orient('iso',[],false);
      return this.model;
    } catch (error) {
      for (const [id, model] of this.fragments.list) {
        if (!before.has(id)) await this.unload(model);
      }
      this.model = previous;
      throw error;
    }
  }

  async unload(model: FRAGS.FragmentsModel) {
    this._highlighted.delete(model);
    this._themes=this._themes.filter(row=>row.model!==model);
    await this.fragments.core.disposeModel(model.modelId);
    if (this.model === model) this.model = undefined;
  }

  /** Reposiciona o modelo no visualizador sem mudar o IFC nem seus GlobalIds. */
  async setModelAlignment(model:FRAGS.FragmentsModel,matrix?:number[]){
    if(!this.baseMatrices.has(model)){model.object.updateMatrix();this.baseMatrices.set(model,model.object.matrix.clone());}
    const delta=matrix?new THREE.Matrix4().fromArray(matrix):new THREE.Matrix4();
    model.object.matrixAutoUpdate=false;
    model.object.matrix.multiplyMatrices(delta,this.baseMatrices.get(model)!);
    model.object.updateMatrixWorld(true);
    await this.fragments.core.update(true);
  }

  /** Reposiciona elementos na visualização; o IFC original não é regravado. */
  async setElementAlignments(model:FRAGS.FragmentsModel,alignments:Record<string,number[]>={}){
    const bases=this.elementBases.get(model)??new Map<number,{guid:string;raw:FRAGS.RawGlobalTransformData}>();
    this.elementBases.set(model,bases);
    const guids=Object.keys(alignments);
    const localIds=await model.getLocalIdsByGuids(guids);
    const wanted=new Map<number,{guid:string;matrix:number[]}>();
    const itemMatrices=new Map<number,THREE.Matrix4>();
    const missing:string[]=[];
    for(let i=0;i<guids.length;i++){
      const localId=localIds[i];
      if(localId===null){missing.push(guids[i]);continue;}
      const transformIds=await model.getGlobalTranformsIdsOfItems([localId]);
      if(!transformIds.length){missing.push(guids[i]);continue;}
      itemMatrices.set(localId,new THREE.Matrix4().fromArray(alignments[guids[i]]));
      for(const id of transformIds){
        const other=wanted.get(id);
        if(other&&other.guid!==guids[i])throw new Error('Dois elementos compartilham a mesma transformação; alinhe o modelo inteiro.');
        wanted.set(id,{guid:guids[i],matrix:alignments[guids[i]]});
      }
    }
    const fresh=[...wanted.keys()].filter(id=>!bases.has(id));
    if(fresh.length){
      const source=await model.getGlobalTransforms(fresh);
      for(const id of fresh){const raw=source.get(id);if(!raw)throw new Error('Transformação do elemento não encontrada.');bases.set(id,{guid:wanted.get(id)!.guid,raw:structuredClone(raw)});}
    }
    if(!bases.size)return missing;
    const modelWorld=model.object.matrixWorld.clone(),inverse=modelWorld.clone().invert();
    const requests:FRAGS.EditRequest[]=[];
    for(const [id,{raw}] of bases){
      const delta=wanted.get(id)?.matrix;
      const localDelta=delta?inverse.clone().multiply(new THREE.Matrix4().fromArray(delta)).multiply(modelWorld):new THREE.Matrix4();
      const next=GeomsFbUtils.transformFromMatrix(localDelta.multiply(GeomsFbUtils.matrixFromTransform(raw)),structuredClone(raw)) as FRAGS.RawGlobalTransformData;
      requests.push({type:EditRequestType.UPDATE_GLOBAL_TRANSFORM,localId:id,data:next});
    }
    const oldChild=model.deltaModelId?this.fragments.list.get(model.deltaModelId):undefined;
    if(oldChild)this._highlighted.delete(oldChild);
    await this.fragments.core.editor.edit(model.modelId,requests);
    await this.fragments.core.update(true);
    this.elementMatrices.set(model,itemMatrices);
    for(const [highlighted,ids]of [...this._highlighted])if(highlighted===model&&ids.length){for(const layer of this.layers(model,ids)){await layer.model.highlight(layer.ids,SELECT_MAT);this._highlighted.set(layer.model,layer.ids);}}
    return missing;
  }

  /** 4D: mostra/oculta elementos de um modelo por localId e força um redraw. */
  async setElementsVisible(
    model: FRAGS.FragmentsModel,
    localIds: number[],
    visible: boolean,
  ) {
    if (localIds.length === 0) return;
    for(const layer of this.layers(model,localIds))await layer.model.setVisible(layer.ids, visible);
    await this.fragments.core.update(true);
  }

  /** Limpa todos os highlights rastreados. */
  private async clearHighlights() {
    for (const [model, ids] of this._highlighted) {
      await model.resetHighlight(ids);
    }
    this._highlighted.clear();
    for(const row of this._themes)for(const layer of this.layers(row.model,row.ids))await layer.model.highlight(layer.ids,{...SELECT_MAT,color:new THREE.Color(row.color)});
  }

  /** Realça um elemento, resetando o realce anterior. */
  async select(localId: number, model?: FRAGS.FragmentsModel): Promise<void> {
    const m = model ?? this.model;
    if (!m) return;
    this.model = m;
    await this.clearHighlights();
    for(const layer of this.layers(m,[localId])){await layer.model.highlight(layer.ids,SELECT_MAT);this._highlighted.set(layer.model,layer.ids);}
    this.model = m;
    await this.fragments.core.update(true);
  }

  /** Realça elementos de qualquer modelo (para seleção via Gantt). */
  async highlightElements(tasks: { model: FRAGS.FragmentsModel; localId: number }[]): Promise<void> {
    await this.clearHighlights();
    const byModel = new Map<FRAGS.FragmentsModel, number[]>();
    for (const t of tasks) {
      (byModel.get(t.model) ?? byModel.set(t.model, []).get(t.model)!).push(t.localId);
    }
    for (const [model, ids] of byModel) {
      for(const layer of this.layers(model,ids)){await layer.model.highlight(layer.ids,SELECT_MAT);this._highlighted.set(layer.model,layer.ids);}
    }
    await this.fragments.core.update(true);
  }

  /** Atributos + PSets de um elemento (para o painel de propriedades). */
  async getItemData(localId: number, model = this.model): Promise<any | null> {
    if (!model) return null;
    const [item] = await model.getItemsData([localId], {
      attributesDefault: true,
      relations: {
        IsDefinedBy: { attributes: true, relations: true },
        ContainedInStructure: { attributes: true, relations: false },
      },
    });
    return item ?? null;
  }

  /** Estrutura espacial (IfcProject → Site → Building → Storey → elementos). */
  async getSpatial(
    model: FRAGS.FragmentsModel | undefined = this.model,
  ): Promise<FRAGS.SpatialTreeItem | null> {
    if (!model) return null;
    return model.getSpatialStructure();
  }

  /** Cota visual da grade; não altera geometria nem coordenadas IFC. */
  setGridElevation(elevation:number){
    if(!Number.isFinite(elevation)||Math.abs(elevation)>1_000_000)throw new Error('Informe uma elevação válida para a grade.');
    this.gridElevation=elevation;
    if(this.grid){this.grid.three.position.y=elevation;this.grid.three.updateMatrixWorld(true);}
    if(this.fragments)void this.fragments.core.update(true).catch(()=>{});
  }

  /** Base do modelo ativo no referencial do visualizador. */
  async modelBaseElevation():Promise<number|null>{
    if(!this.model)return null;
    const box=this.model.box;
    return box.isEmpty()?null:box.min.y;
  }

  /** Ponto IFC sob o cursor; na ausência de geometria, interseção com a grade. */
  async pointAt(clientX:number,clientY:number):Promise<{x:number;y:number;z:number;source:'modelo'|'grade'}|null>{
    const camera=this.world.camera.three as THREE.PerspectiveCamera;
    let best:{point:THREE.Vector3;distance:number}|null=null;
    for(const model of this.fragments.list.values()){
      const hit=await model.raycast({camera,mouse:new THREE.Vector2(clientX,clientY),dom:this.canvas});
      if(hit&&(!best||hit.distance<best.distance))best={point:hit.point,distance:hit.distance};
    }
    if(best)return {x:best.point.x,y:best.point.y,z:best.point.z,source:'modelo'};
    const rect=this.canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    const ndc=new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
    const ray=new THREE.Raycaster();ray.setFromCamera(ndc,camera);
    const point=new THREE.Vector3();
    if(!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-this.gridElevation),point))return null;
    return {x:point.x,y:point.y,z:point.z,source:'grade'};
  }

  /** Canvas do renderer, para eventos de ponteiro. */
  get canvas(): HTMLCanvasElement {
    return this.world.renderer!.three.domElement;
  }

  /**
   * Raycast na posição do ponteiro contra TODOS os modelos carregados → localId
   * do elemento mais próximo (ou null). O modelo atingido vira o `model` ativo,
   * então select/getItemData/props passam a operar sobre ele.
   */
  async pickAt(clientX: number, clientY: number): Promise<number | null> {
    const mouse = new THREE.Vector2(clientX, clientY);
    const camera = this.world.camera.three as THREE.PerspectiveCamera;
    let best: { model: FRAGS.FragmentsModel; localId: number; distance: number } | null =
      null;
    for (const model of this.fragments.list.values()) {
      const res = await model.raycast({ camera, mouse, dom: this.canvas });
      if (res?.localId == null) continue;
      if (!best || res.distance < best.distance)
        best = { model, localId: res.localId, distance: res.distance };
    }
    if (!best) return null;
    this.model = best.model.isDeltaModel?this.fragments.list.get(best.model.parentModelId??'')??best.model:best.model;
    return best.localId;
  }

  async fitToModel() {
    if (!this.model) return;
    const boxes = await this.model.getBoxes();
    for(const child of this.fragments.list.values())if(child.parentModelId===this.model.modelId)boxes.push(child.box);
    if (!boxes?.length) return;
    const union = boxes.reduce((acc, b) => acc.union(b), boxes[0].clone());
    await this.world.camera.controls.fitToSphere(union.getBoundingSphere(new THREE.Sphere()), true);
  }

  async fitToElements(tasks:{model:FRAGS.FragmentsModel;localId:number}[]){
    const boxes:THREE.Box3[]=[];for(const model of new Set(tasks.map(t=>t.model))){const ids=Array.from(new Set(tasks.filter(t=>t.model===model).map(t=>t.localId))),items=await model.getBoxes(ids);items.forEach((box,i)=>{const delta=this.elementMatrices.get(model)?.get(ids[i]);boxes.push(delta?box.applyMatrix4(delta):box);});}
    if(!boxes.length)return;const union=boxes.reduce((a,b)=>a.union(b),boxes[0].clone());await this.world.camera.controls.fitToSphere(union.getBoundingSphere(new THREE.Sphere()),true);
  }

  async orient(direction:string,tasks:{model:FRAGS.FragmentsModel;localId:number}[]=[],animate=true){
    if(!this.model)return;const boxes:THREE.Box3[]=[];
    if(tasks.length){for(const model of new Set(tasks.map(t=>t.model))){const ids=Array.from(new Set(tasks.filter(t=>t.model===model).map(t=>t.localId))),items=await model.getBoxes(ids);items.forEach((box,i)=>{const delta=this.elementMatrices.get(model)?.get(ids[i]);boxes.push(delta?box.applyMatrix4(delta):box);});}}
    else{boxes.push(...await this.model.getBoxes());for(const child of this.fragments.list.values())if(child.parentModelId===this.model.modelId)boxes.push(child.box);}if(!boxes.length)return;
    const box=boxes.reduce((a,b)=>a.union(b),boxes[0].clone()),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const distance=Math.max(size.x,size.y,size.z)*1.8||20;
    const offset=direction==='top'?new THREE.Vector3(0,distance,.001):direction==='front'?new THREE.Vector3(0,0,distance):direction==='side'?new THREE.Vector3(distance,0,0):new THREE.Vector3(distance*.8,distance*.6,distance*.8);
    await this.world.camera.controls.setLookAt(center.x+offset.x,center.y+offset.y,center.z+offset.z,center.x,center.y,center.z,false);
    // fitToBox gira para o eixo mais próximo e pode mostrar uma laje de perfil.
    await this.world.camera.controls.fitToSphere(box.getBoundingSphere(new THREE.Sphere()),animate);
  }

  async applySimulation(visible:{model:FRAGS.FragmentsModel;localId:number}[],hidden:{model:FRAGS.FragmentsModel;localId:number}[],active:{model:FRAGS.FragmentsModel;localId:number}[]){
    await this.clearHighlights();
    for(const model of this.fragments.list.values()){
      const parent=model.isDeltaModel?this.fragments.list.get(model.parentModelId??'')??model:model;
      const allowed=model.isDeltaModel?this.elementMatrices.get(parent):undefined;
      const show=Array.from(new Set(visible.filter(t=>t.model===parent&&(!model.isDeltaModel||allowed?.has(t.localId))).map(t=>t.localId))),hide=Array.from(new Set(hidden.filter(t=>t.model===parent&&(!model.isDeltaModel||allowed?.has(t.localId))).map(t=>t.localId)));
      if(hide.length)await model.setVisible(hide,false);if(show.length)await model.setVisible(show,true);
      const current=Array.from(new Set(active.filter(t=>t.model===parent&&(!model.isDeltaModel||allowed?.has(t.localId))).map(t=>t.localId)));
      if(current.length){await model.highlight(current,SELECT_MAT);this._highlighted.set(model,current);}
    }
    await this.fragments.core.update(true);
  }

  async showAll(){await this.clearHighlights();for(const model of this.fragments.list.values())await model.resetVisible();await this.fragments.core.update(true);}
}
