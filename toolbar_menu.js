const RESIZE_PREFIX = "resize-";

function updateMenuWithPresets()
{
   let getPresets = browser.storage.sync.get("presets");
   getPresets.then((obj) => {
      if(obj != undefined)
      {
         let menu = document.querySelector("#presets");

         let presets = obj.presets;
         for(let i = 0;i < presets.length;i++)
         {
            let a = document.createElement("a");
            a.href = "#";
            a.id = RESIZE_PREFIX + presets[i].width + "x" + presets[i].height;
            a.innerHTML = presets[i].width + "x" + presets[i].height + " " + presets[i].name;
            menu.appendChild(a);

            let br = document.createElement("br");
            menu.appendChild(br);
         }
      }
   });

}

function doMenuClick(e)
{
   let myId = e.target.id;

   if(myId === "customize")
   {
      browser.runtime.openOptionsPage();
   }
   else if(myId.startsWith(RESIZE_PREFIX))
   {
      let xPos = myId.indexOf("x",RESIZE_PREFIX.length);
      let newWidth = parseInt(myId.substring(RESIZE_PREFIX.length,xPos));
      let newHeight = parseInt(myId.substring(xPos + 1));
      let updateInfo = {
         "width": newWidth,
         "height": newHeight
      };

      browser.windows.getCurrent().then((currentWindow) => {
         browser.windows.update(currentWindow.id, updateInfo);
      });
   }

   e.preventDefault();
}

document.addEventListener('DOMContentLoaded', updateMenuWithPresets);
document.addEventListener("click", doMenuClick);
