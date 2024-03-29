async function updateMenuWithPresets()
{
   let list = document.querySelector("#presetsList");

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      let position = i + 1;
      console.log("(menu) Add item " + position + ": " + presets[i].name);

      let linkText = presets[i].width + "x" + presets[i].height + " " + presets[i].name;
      let numberText = position + ": ";
      let shortcutKey = await getShortcutKey(PREFIX_PRESET + position);

      let tr = document.createElement("tr");

      let tdN = document.createElement("td");
      tr.className = "presetIndex";
      tdN.appendChild(document.createTextNode(numberText));
      tr.appendChild(tdN);

      let tdL = document.createElement("td");

      let a = document.createElement("a");
      a.href = "#";
      a.id = PREFIX_PRESET + presets[i].id;
      a.title = shortcutKey;
      a.appendChild(document.createTextNode(linkText));
      tdL.appendChild(a);

      tr.appendChild(tdL);

      list.appendChild(tr);
   }
}

async function doMenuItemClick(e)
{
   console.log("(menu) item clicked");

   e.preventDefault();

   let storage = await browser.storage.local.get("options");
   let options = storage.options;
   let keepActionMenuOnClick = storage.options.keepActionMenuOnClick !== undefined && storage.options.keepActionMenuOnClick;

   let myId = e.target.id;
   if(myId === "customize")
   {
      browser.runtime.openOptionsPage();
      keepActionMenuOnClick = false;  // Force menu closed in this case
   }
   else if(myId.startsWith(PREFIX_PRESET))
   {
      let presetId = myId.substring(PREFIX_PRESET.length);
      await applyPreset(presetId);
   }

   if(keepActionMenuOnClick)
   {
      showCurrentSize();
   }
   else
   {
      window.close();
   }
}

async function showCurrentSize()
{
   let currentWindow = await browser.windows.getCurrent();
   document.querySelector("#currentSize").textContent = currentWindow.width + "x" + currentWindow.height;
}

document.addEventListener("DOMContentLoaded", updateMenuWithPresets);
document.addEventListener("click", doMenuItemClick);
window.onload = () => setTimeout(showCurrentSize,1000);  // This is such a kludge, but there seems to be no other event to latch on to that gives correct results
