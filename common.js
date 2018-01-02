const PREFIX_PRESET = "preset-";

async function applyPreset(presetId)
{
   console.log("(common) applying preset: " + presetId);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      if(presets[i].id == presetId)
      {
         resizeWindow(presets[i].width,presets[i].height);
         break;
      }
   }
}

async function resizeWindow(newWidth, newHeight)
{
   console.log("(common) resizing to: " + newWidth + "x" + newHeight);

   let updateInfo = {
      "width": parseInt(newWidth),
      "height": parseInt(newHeight)
   };

   let currentWindow = await browser.windows.getCurrent();
   browser.windows.update(currentWindow.id, updateInfo);
}
