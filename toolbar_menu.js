function updateMenuWithPresets()
{
   let getPresets = browser.storage.local.get("presets");
   getPresets.then((obj) => {
      if(obj != undefined)
      {
         let list = document.querySelector("#presetsList");

         let presets = obj.presets;
         for(let i = 0;i < presets.length;i++)
         {
            let linkText = presets[i].width + "x" + presets[i].height + " " + presets[i].name;
            let numberText = "&nbsp;";
            if(i < 9)
            {
               numberText = (i + 1) + ": ";
            }

            let tr = document.createElement("tr");

            let tdN = document.createElement("td");
            tr.className = "presetIndex";
            tdN.appendChild(document.createTextNode(numberText));
            tr.appendChild(tdN);

            let tdL = document.createElement("td");

            let a = document.createElement("a");
            a.href = "#";
            a.id = PREFIX_PRESET + presets[i].id;
            a.appendChild(document.createTextNode(linkText));
            tdL.appendChild(a);

            tr.appendChild(tdL);

            list.appendChild(tr);
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
   else if(myId.startsWith(PREFIX_PRESET))
   {
      let presetId = myId.substring(PREFIX_PRESET.length);
      applyPreset(presetId);
   }

   e.preventDefault();
}

document.addEventListener('DOMContentLoaded', updateMenuWithPresets);
document.addEventListener("click", doMenuClick);
