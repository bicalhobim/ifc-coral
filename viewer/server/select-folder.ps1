$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Windows Common Item Dialog. No hidden Forms owner and no browser folder API.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace IfcCoral {
 [ComImport, Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")] class FileOpenDialog {}
 [ComImport, Guid("D57C7288-D4AD-4768-BE02-9D969532D960"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IFileOpenDialog {
  [PreserveSig] int Show(IntPtr parent);
  void SetFileTypes(uint count, IntPtr types);
  void SetFileTypeIndex(uint index);
  void GetFileTypeIndex(out uint index);
  void Advise(IntPtr events, out uint cookie);
  void Unadvise(uint cookie);
  void SetOptions(uint options);
  void GetOptions(out uint options);
  void SetDefaultFolder(IShellItem item);
  void SetFolder(IShellItem item);
  void GetFolder(out IShellItem item);
  void GetCurrentSelection(out IShellItem item);
  void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name);
  void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string name);
  void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
  void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string label);
  void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string label);
  void GetResult(out IShellItem result);
  void AddPlace(IShellItem item, int alignment);
  void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string extension);
  void Close(int result);
  void SetClientGuid(ref Guid guid);
  void ClearClientData();
  void SetFilter(IntPtr filter);
  void GetResults(out IntPtr results);
  void GetSelectedItems(out IntPtr items);
 }
 [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IShellItem {
  void BindToHandler(IntPtr context, ref Guid handler, ref Guid iid, out IntPtr result);
  void GetParent(out IShellItem parent);
  void GetDisplayName(uint type, out IntPtr name);
  void GetAttributes(uint mask, out uint attributes);
  void Compare(IShellItem other, uint hint, out int order);
 }
 public static class NativeFolderDialog {
  public static string Pick() {
   IFileOpenDialog dialog = (IFileOpenDialog)new FileOpenDialog();
   IShellItem item = null;
   try {
    uint options; dialog.GetOptions(out options);
    dialog.SetOptions(options | 0x20u | 0x40u | 0x800u | 0x8u | 0x02000000u);
    dialog.SetTitle("IFC Coral - Escolher pasta");
    dialog.SetOkButtonLabel("Usar esta pasta");
    int result = dialog.Show(IntPtr.Zero);
    if(result == unchecked((int)0x800704C7))return null;
    if(result != 0)Marshal.ThrowExceptionForHR(result);
    dialog.GetResult(out item);
    IntPtr value; item.GetDisplayName(0x80058000u, out value);
    try{return Marshal.PtrToStringUni(value);}finally{Marshal.FreeCoTaskMem(value);}
   } finally {
    if(item != null)Marshal.FinalReleaseComObject(item);
    Marshal.FinalReleaseComObject(dialog);
   }
  }
 }
}
'@
$folder = [IfcCoral.NativeFolderDialog]::Pick()
if ($null -eq $folder) {
 [Console]::Write('{"cancelled":true}')
} else {
 [Console]::Write((@{cancelled=$false;path=$folder} | ConvertTo-Json -Compress))
}
