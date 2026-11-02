import * as OBC from "@thatopen/components";
import type * as FRAGS from "@thatopen/fragments";
import * as THREE from "three";
import { RenderedFaces } from "@thatopen/fragments";

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
  readonly components = new OBC.Components();
  fragments!: OBC.FragmentsManager;
  world!: OBC.SimpleWorld<OBC.SimpleScene, OBC.SimpleCamera, OBC.SimpleRenderer>;
  /** Modelo ativo: o último carregado, ou o clicado no viewport (ver pickAt). */
  model?: FRAGS.FragmentsModel;
  private _highlighted = new Map<FRAGS.FragmentsModel, number[]>();
  private _themes: {model:FRAGS.FragmentsModel;ids:number[];color:string}[]=[];
  async setManagementColors(rows:{model:FRAGS.FragmentsModel;ids:number[];color:string}[]){
    for(const row of this._themes)await row.model.resetHighlight(row.ids);
    this._themes=rows;
    for(const row of rows)await row.model.highlight(row.ids,{...SELECT_MAT,color:new THREE.Color(row.color)});
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
    this.components.get(OBC.Grids).create(world);

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

  /** 4D: mostra/oculta elementos de um modelo por localId e força um redraw. */
  async setElementsVisible(
    model: FRAGS.FragmentsModel,
    localIds: number[],
    visible: boolean,
  ) {
    if (localIds.length === 0) return;
    await model.setVisible(localIds, visible);
    await this.fragments.core.update(true);
  }

  /** Limpa todos os highlights rastreados. */
  private async clearHighlights() {
    for (const [model, ids] of this._highlighted) {
      await model.resetHighlight(ids);
    }
    this._highlighted.clear();
    for(const row of this._themes)await row.model.highlight(row.ids,{...SELECT_MAT,color:new THREE.Color(row.color)});
  }

  /** Realça um elemento, resetando o realce anterior. */
  async select(localId: number, model?: FRAGS.FragmentsModel): Promise<void> {
    const m = model ?? this.model;
    if (!m) return;
    this.model = m;
    await this.clearHighlights();
    await m.highlight([localId], SELECT_MAT);
    this._highlighted.set(m, [localId]);
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
      await model.highlight(ids, SELECT_MAT);
      this._highlighted.set(model, ids);
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
    this.model = best.model;
    return best.localId;
  }

  async fitToModel() {
    if (!this.model) return;
    const boxes = await this.model.getBoxes();
    if (!boxes?.length) return;
    const union = boxes.reduce((acc, b) => acc.union(b), boxes[0].clone());
    await this.world.camera.controls.fitToSphere(union.getBoundingSphere(new THREE.Sphere()), true);
  }

  async fitToElements(tasks:{model:FRAGS.FragmentsModel;localId:number}[]){
    const boxes:THREE.Box3[]=[];for(const model of new Set(tasks.map(t=>t.model))){boxes.push(...await model.getBoxes(Array.from(new Set(tasks.filter(t=>t.model===model).map(t=>t.localId)))));}
    if(!boxes.length)return;const union=boxes.reduce((a,b)=>a.union(b),boxes[0].clone());await this.world.camera.controls.fitToSphere(union.getBoundingSphere(new THREE.Sphere()),true);
  }

  async orient(direction:string,tasks:{model:FRAGS.FragmentsModel;localId:number}[]=[],animate=true){
    if(!this.model)return;const boxes:THREE.Box3[]=[];
    if(tasks.length){for(const model of new Set(tasks.map(t=>t.model)))boxes.push(...await model.getBoxes(Array.from(new Set(tasks.filter(t=>t.model===model).map(t=>t.localId)))));}
    else boxes.push(...await this.model.getBoxes());if(!boxes.length)return;
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
      const show=Array.from(new Set(visible.filter(t=>t.model===model).map(t=>t.localId))),hide=Array.from(new Set(hidden.filter(t=>t.model===model).map(t=>t.localId)));
      if(hide.length)await model.setVisible(hide,false);if(show.length)await model.setVisible(show,true);
      const current=Array.from(new Set(active.filter(t=>t.model===model).map(t=>t.localId)));
      if(current.length){await model.highlight(current,SELECT_MAT);this._highlighted.set(model,current);}
    }
    await this.fragments.core.update(true);
  }

  async showAll(){await this.clearHighlights();for(const model of this.fragments.list.values())await model.resetVisible();await this.fragments.core.update(true);}
}
