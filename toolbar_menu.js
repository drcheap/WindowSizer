async function updateMenuWithPresets()
{
   const list = document.querySelector("#presetsList");

   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      const position = i + 1;
      console.debug("Adding menu item " + position + ": " + presets[i].name);

      const linkText = presets[i].width + "x" + presets[i].height + " " + presets[i].name;
      const numberText = position + ": ";
      const shortcutKey = await getShortcutKey(PREFIX_PRESET + position);

      const tr = document.createElement("tr");

      const tdN = document.createElement("td");
      tr.className = "presetIndex";
      tdN.appendChild(document.createTextNode(numberText));
      tr.appendChild(tdN);

      const tdL = document.createElement("td");

      const a = document.createElement("a");
      a.href = "#";
      a.id = PREFIX_PRESET + presets[i].id;
      a.title = shortcutKey;
      a.appendChild(document.createTextNode(linkText));
      tdL.appendChild(a);

      tr.appendChild(tdL);

      list.appendChild(tr);
   }

   showCurrentSize();
}

async function doMenuItemClick(e)
{
   console.debug("Menu item clicked");

   e.preventDefault();

   const storage = await browser.storage.local.get("options");
   const options = storage.options;
   let keepActionMenuOnClick = storage.options.keepActionMenuOnClick !== undefined && storage.options.keepActionMenuOnClick;

   const myId = e.target.id;
   if(myId === "customize")
   {
      browser.runtime.openOptionsPage();
      keepActionMenuOnClick = false;  // Force menu closed in this case
   }
   else if(myId.startsWith(PREFIX_PRESET))
   {
      const presetId = myId.substring(PREFIX_PRESET.length);
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
   const currentWindow = await browser.windows.getCurrent();
   const currentSize = currentWindow.width + "x" + currentWindow.height;
   document.querySelector("#currentSize").textContent = currentSize;
   console.debug("Updated size indicator: " + currentSize);
}

document.addEventListener("DOMContentLoaded", updateMenuWithPresets);
document.addEventListener("click", doMenuItemClick);
