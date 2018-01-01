const PREFIX_PRESET = "preset-";

function applyPreset(presetId)
{
   console.log("(common) applying preset: " + presetId);

   browser.storage.local.get("presets").then((obj) => {
      if(obj != undefined)
      {
         let presets = obj.presets;
         for(let i = 0;i < presets.length;i++)
         {
            if(presets[i].id == presetId)
            {
               resizeWindow(presets[i].width,presets[i].height);
               break;
            }
         }
      }
   });
}

function resizeWindow(newWidth, newHeight)
{
   console.log("(common) resizing to: " + newWidth + "x" + newHeight);

   let updateInfo = {
      "width": parseInt(newWidth),
      "height": parseInt(newHeight)
   };

   browser.windows.getCurrent().then((currentWindow) => {
      browser.windows.update(currentWindow.id, updateInfo);
   });
}
