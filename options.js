const MODE_NEW = "new";
const MODE_EDIT = "edit";
const OVERSIZE_ALLOWANCE_DEFAULT = 1.1;
const QUICK_RESIZE_INFO = "Quick Resize mode changes the behavior of the extension icon in the browser toolbar/extensions menu.  Instead of getting the standard popup menu with presets and other options, it will immediately activate the first preset and do nothing else.  Note that using this option prevents use of the 'Keep toolbar menu open...' option.";

var useQuickResizeMode = false;
var keepActionMenuOnClick = false;
var oversizeAllowance = OVERSIZE_ALLOWANCE_DEFAULT;

function makeID()
{
   // This is not *perfect* but works as long as it's not called multiple times in the same millisecond (o).(O)
   return new Date().valueOf();
}


// hasClass, addClass, removeClass functions borrowed (and reformatted) from: https://stackoverflow.com/questions/6787383
function hasClass(ele,cls)
{
   return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls)
{
   if(!hasClass(ele,cls))
   {
      ele.className += " " + cls;
   }
}

function removeClass(ele,cls)
{
   if (hasClass(ele,cls))
   {
      const reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      ele.className = ele.className.replace(reg,' ');
   }
}

function extend(a, b)
{
   for(let key in b)
   {
      if(b.hasOwnProperty(key))
      {
         a[key] = b[key];
      }
   }

   return a;
}

Array.prototype.move = function(from, to) {
   if(from >=0 && from < this.length && to >= 0 && to < this.length)
   {
      this.splice(to, 0, this.splice(from, 1)[0]);
   }
};

function getId(fullString,prefixToRemove)
{
   return parseInt(fullString.substring(prefixToRemove.length));
}

function getValues(mode)
{
   let hasError = false;

   const eW = document.querySelector("#" + mode + "Width");
   const width = parseInt(eW.value);
   if(Number.isInteger(width) && width > 0 && width <= screen.availWidth * oversizeAllowance)
   {
      removeClass(eW,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eW,"invalid");
   }

   const eH = document.querySelector("#" + mode + "Height");
   const height = parseInt(eH.value);
   if(Number.isInteger(height) && height > 0 && height <= screen.availHeight * oversizeAllowance)
   {
      removeClass(eH,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eH,"invalid");
   }

   const eN = document.querySelector("#" + mode + "Name");
   const name = eN.value;

   const result = {"valid": !hasError};
   const eS = document.querySelector("#" + mode + "Status");
   if(hasError)
   {
      eS.textContent = "Please correct errors";
      addClass(eS,"errmsg");
   }
   else
   {
      eW.value = "";
      eH.value = "";
      eN.value = "";
      eS.textContent = "";
      removeClass(eS,"errmsg");
      result.width = width;
      result.height = height;
      result.name = name;
   }
   return result;
}

async function loadOptions()
{
   const storage = await browser.storage.local.get("options");
   const options = storage.options;

   useQuickResizeMode = options.useQuickResizeMode !== undefined && options.useQuickResizeMode;
   document.querySelector("#useQuickResizeMode").checked = useQuickResizeMode;

   keepActionMenuOnClick = options.keepActionMenuOnClick !== undefined && options.keepActionMenuOnClick;
   document.querySelector("#keepActionMenuOnClick").checked = keepActionMenuOnClick;
   document.querySelector("#keepActionMenuOnClick").disabled = document.querySelector("#useQuickResizeMode").checked;
}

async function loadAdvancedSettings()
{
   const storage = await browser.storage.local.get("advanced");
   const advanced = storage.advanced;

   if(advanced.oversizeAllowance !== undefined)
   {
      oversizeAllowance = advanced.oversizeAllowance;
   }
   document.querySelector("#oversizeAllowance").value = oversizeAllowance;
}

async function displayPresets()
{
   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;

   const existingRows = document.querySelectorAll(".presetItem");
   for(let row of existingRows)
   {
      console.debug("Remove item row");
      row.remove();
   };

   const presetCount = presets.length;
   for(let i = 0;i < presetCount;i++)
   {
      const presetNum = i + 1;
      const isFirst = (i == 0);
      const isLast = (i == presetCount - 1);
      console.debug("Add item " + presetNum + ": " + presets[i].name);

      const myId = presets[i].id;

      // Make the row, the annoying but safe way
      const tr = document.createElement("tr");
      tr.className = "presetItem";

      const tdP = document.createElement("td");

      const imgDown = document.createElement("img");
      imgDown.width = 12;
      imgDown.height = 12;
      if(isLast)
      {
         imgDown.src = "images/arrow_none.png";
      }
      else
      {
         imgDown.src = "images/arrow_down.png";
         imgDown.title = "Move Down";
         imgDown.id = PREFIX_DOWN + i;
         addClass(imgDown,"imgDown");
         imgDown.addEventListener("click", moveDown);
      }
      tdP.appendChild(imgDown);

      tdP.appendChild(document.createTextNode(" "));

      const imgUp = document.createElement("img");
      imgUp.width = 12;
      imgUp.height = 12;
      if(isFirst)
      {
         imgUp.src = "images/arrow_none.png";
      }
      else
      {
         imgUp.src = "images/arrow_up.png";
         imgUp.title = "Move Up";
         imgUp.id = PREFIX_UP + i;
         addClass(imgUp,"imgUp");
         imgUp.addEventListener("click", moveUp);
      }
      tdP.appendChild(imgUp);

      tr.appendChild(tdP);

      const tdK = document.createElement("td");
      tdK.textContent = await getShortcutKey(PREFIX_PRESET + presetNum);
      tr.appendChild(tdK);

      const tdW = document.createElement("td");
      tdW.textContent = presets[i].width;
      tr.appendChild(tdW);

      const tdH = document.createElement("td");
      tdH.textContent = presets[i].height;
      tr.appendChild(tdH);

      const tdN = document.createElement("td");
      tdN.textContent = presets[i].name;
      tr.appendChild(tdN);

      const tdA = document.createElement("td");

      const btnE = document.createElement("button");
      btnE.type = "button";
      btnE.id = PREFIX_EDIT + myId;
      btnE.textContent = "Edit";
      btnE.addEventListener("click", editPreset);
      tdA.appendChild(btnE);

      tdA.appendChild(document.createTextNode(" "));

      const btnR = document.createElement("button");
      btnR.type = "button";
      btnR.id = PREFIX_REMOVE + myId;
      btnR.textContent = "Remove";
      btnR.addEventListener("click", removePreset);
      tdA.appendChild(btnR);

      tr.appendChild(tdA);

      tr.appendChild(document.createElement("td"));

      // Add it to the table
      const lastRow = document.querySelector("#addPreset");
      lastRow.parentNode.insertBefore(tr,lastRow);
   }
}

async function useCurrentSize()
{
   const pendingEdit = document.querySelector("#editStatus");
   const mode = pendingEdit == null ? MODE_NEW : MODE_EDIT;
   const currentWindow = await browser.windows.getCurrent();
   document.querySelector("#" + mode + "Width").value = currentWindow.width;
   document.querySelector("#" + mode + "Height").value = currentWindow.height;
}

async function addPreset(e)
{
   e.preventDefault();

   const values = getValues(MODE_NEW);
   if(values.valid)
   {
      console.debug("Adding preset: " + values.width + "x" + values.height + " " + values.name);

      const item = {
         "id": makeID(),
         "width": values.width,
         "height": values.height,
         "name": values.name
      };

      const storage = await browser.storage.local.get("presets");
      const presets = storage.presets;
      presets.push(item);
      await browser.storage.local.set({"presets": presets});
      displayPresets();
   }
}

async function editPreset(e)
{
   e.preventDefault();

   const myId = getId(e.target.id,PREFIX_EDIT);

   const pendingEdit = document.querySelector("#editStatus");
   if(pendingEdit != null)
   {
      // Abort the other & try this one again
      await cancelEdits();
      document.querySelector("#" + PREFIX_EDIT + myId).click();
      return;
   }

   const tr = e.target.parentElement.parentElement;

   // Replace values with editable versions
   const tdW = tr.children[2]
   const inW = document.createElement("input");
   inW.type = "text";
   inW.id = "editWidth";
   inW.value = tdW.textContent;
   inW.size = 4;
   inW.maxLength = 4;
   tdW.textContent = "";
   tdW.appendChild(inW);

   const tdH = tr.children[3]
   const inH = document.createElement("input");
   inH.type = "text";
   inH.id = "editHeight";
   inH.value = tdH.textContent;
   inH.size = 4;
   inH.maxLength = 4;
   tdH.textContent = "";
   tdH.appendChild(inH);

   const tdN = tr.children[4]
   const inN = document.createElement("input");
   inN.type = "text";
   inN.id = "editName";
   inN.value = tdN.textContent;
   inN.size = 15;
   inN.maxLength = 15;
   tdN.textContent = "";
   tdN.appendChild(inN);

   // Offer a different set of actions
   const tdA = tr.children[5];
   tdA.textContent = "";

   const btnS = document.createElement("button");
   btnS.type = "button";
   btnS.id = PREFIX_SAVE + myId;
   btnS.textContent = "Save";
   btnS.addEventListener("click", saveEdits);
   tdA.appendChild(btnS);

   tdA.appendChild(document.createTextNode(" "));

   const btnC = document.createElement("button");
   btnC.type = "button";
   btnC.id = PREFIX_CANCEL + myId;
   btnC.textContent = "Cancel";
   btnC.addEventListener("click", cancelEdits);
   tdA.appendChild(btnC);

   const tdS = tr.children[6];
   tdS.id = "editStatus";
}

async function saveEdits(e)
{
   e.preventDefault();

   const values = getValues(MODE_EDIT);
   if(values.valid)
   {
      const myId = getId(e.target.id,PREFIX_EDIT);
      console.debug("Request to edit id=" + myId);

      const storage = await browser.storage.local.get("presets");
      const presets = storage.presets;
      for(let i = 0;i < presets.length;i++)
      {
         if(presets[i].id === myId)
         {
            console.debug("Found it at i=" + i);

            presets[i].width = values.width;
            presets[i].height = values.height;
            presets[i].name = values.name;
            break;
         }
      }

      await browser.storage.local.set({"presets": presets});
      displayPresets();
   }
}

async function cancelEdits()
{
   // displayPresets() will take care of this by reloading everything
   await displayPresets();
}

async function removePreset(e)
{
   e.preventDefault();

   const myId = getId(e.target.id,PREFIX_REMOVE);
   console.debug("Request to remove id=" + myId);

   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      if(presets[i].id === myId)
      {
         console.debug("Found it at i=" + i);

         presets.splice(i,1); // Removes this item
         break;
      }
   }

   await browser.storage.local.set({"presets": presets});
   displayPresets();
}

async function moveDown(e)
{
   e.preventDefault();

   const myPos = getId(e.target.id,PREFIX_DOWN);
   console.debug("Moving down from " + myPos);

   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;
   presets.move(myPos,myPos + 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();
}

async function moveUp(e)
{
   e.preventDefault();

   const myPos = getId(e.target.id,PREFIX_UP);
   console.debug("Moving up from " + myPos);

   const storage = await browser.storage.local.get("presets");
   const presets = storage.presets;
   presets.move(myPos,myPos - 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();
}

async function setUseQuickResizeMode()
{
   const storage = await browser.storage.local.get("options");
   const options = storage.options;
   extend(options,{"useQuickResizeMode": document.querySelector("#useQuickResizeMode").checked});
   await browser.storage.local.set({"options": options});

   document.querySelector("#keepActionMenuOnClick").disabled = document.querySelector("#useQuickResizeMode").checked;
   applyQuickResizeSetting();
}

async function setKeepActionMenuOnClick()
{
   const storage = await browser.storage.local.get("options");
   const options = storage.options;
   extend(options,{"keepActionMenuOnClick": document.querySelector("#keepActionMenuOnClick").checked});
   await browser.storage.local.set({"options": options});
}

async function setOversizeAllowance()
{
   const storage = await browser.storage.local.get("advanced");
   const advanced = storage.advanced;
   extend(advanced,{"oversizeAllowance": Number(document.querySelector("#oversizeAllowance").value) });
   await browser.storage.local.set({"advanced": advanced});
}

async function resetAdvanced()
{
   await browser.storage.local.set({"advanced": {"oversizeAllowance": OVERSIZE_ALLOWANCE_DEFAULT} });
   loadAdvancedSettings();
}

async function showAdvanced()
{
   document.querySelector("#acceptAdvanced").style.display = "none";
   document.querySelector("#theAdvanced").style.display = "block";
}

async function doOnLoad()
{
   displayPresets();
   loadOptions();
   displayBackups();
   loadAdvancedSettings();
}

async function updateSizes()
{
   const currentWindow = await browser.windows.getCurrent();
   document.querySelector("#currentSize").textContent = currentWindow.width + "x" + currentWindow.height + " (click to use)";
   document.querySelector("#screenSize").textContent = screen.availWidth + "x" + screen.availHeight;
}

async function displayBackups()
{
   const storage = await browser.storage.sync.get("backups");
   if(storage.backups === undefined)
   {
      console.debug("Initializing backups storage...");
      storage.backups = [];
      await browser.storage.sync.set({"backups": storage.backups});
   }

   const backups = storage.backups;

   const existingRows = document.querySelectorAll(".backupItem");
   for(let row of existingRows)
   {
      console.debug("Remove item row");
      row.remove();
   };

   const backupCount = backups.length;
   for(let i = 0;i < backupCount;i++)
   {
      const buId = backups[i].id;

      console.debug("Add item " + buId + ": " + backups[i].name);

      const isLast = (i == backupCount - 1);
      const bList = document.querySelector("#backupList");

      const buItem = document.createElement("div");
      buItem.className = "backupItem";

      const btnU = document.createElement("button");
      btnU.type = "button";
      btnU.id = PREFIX_UPDATE + buId;
      btnU.textContent = "Update";
      btnU.addEventListener("click", backupAction);
      buItem.appendChild(btnU);

      buItem.appendChild(document.createTextNode(" "));

      const btnR = document.createElement("button");
      btnR.type = "button";
      btnR.id = PREFIX_RESTORE + buId;
      btnR.textContent = "Restore";
      btnR.addEventListener("click", backupAction);
      buItem.appendChild(btnR);

      buItem.appendChild(document.createTextNode(" "));

      const btnD = document.createElement("button");
      btnD.type = "button";
      btnD.id = PREFIX_REMOVE + buId;
      btnD.textContent = "Delete";
      btnD.addEventListener("click", backupAction);
      buItem.appendChild(btnD);

      const savedAt = new Date(backups[i].saveTime);
      buItem.appendChild(document.createTextNode(" " + backups[i].name + " (Saved at: " + savedAt.toLocaleString() + ")"));

      bList.appendChild(buItem);
   }
}

function backupAction(e)
{
   e.preventDefault();

   const myId = e.target.id;
   const buId = -1;
   if(myId.startsWith(PREFIX_UPDATE))
   {
      updateBackup(getId(myId,PREFIX_UPDATE));
   }
   else if(myId.startsWith(PREFIX_RESTORE))
   {
      restoreBackup(getId(myId,PREFIX_RESTORE));
   }
   else if(myId.startsWith(PREFIX_REMOVE))
   {
      deleteBackup(getId(myId,PREFIX_REMOVE));
   }
}

async function updateBackup(buId)
{
   const storage = await browser.storage.sync.get("backups");
   const backups = storage.backups;

   if(buId !== undefined)
   {
      for(let i = 0;i < backups.length;i++)
      {
         if(backups[i].id === buId)
         {
            console.debug("Found it at i=" + i);

            document.querySelector("#newBackupName").value = backups[i].name;
            saveBackup();
            break;
         }
      }
   }
}

async function restoreBackup(buId)
{
   const storage = await browser.storage.sync.get("backups");
   const backups = storage.backups;

   let foundIndex = -1;

   if(buId !== undefined)
   {
      for(let i = 0;i < backups.length;i++)
      {
         if(backups[i].id === buId)
         {
            console.debug("Found it at i=" + i);
            foundIndex = i;
            break;
         }
      }
   }

   if(foundIndex == -1)
   {
      console.debug("Not found, no changes made");
   }
   else
   {
      if(confirm("Restoring '" + backups[foundIndex].name + "' will overwrite your current options!"))
      {
         console.debug("Restoring");

         const storageToLoad = backups[foundIndex].storage;
         await browser.storage.local.set(storageToLoad);
         doOnLoad();
      }
   }
}

async function deleteBackup(buId)
{
   const storage = await browser.storage.sync.get("backups");
   const backups = storage.backups;

   let foundIndex = -1;

   if(buId !== undefined)
   {
      for(let i = 0;i < backups.length;i++)
      {
         if(backups[i].id === buId)
         {
            console.debug("Found it at i=" + i);
            foundIndex = i;
            break;
         }
      }
   }

   if(foundIndex == -1)
   {
      console.debug("Not found, no changes made");
   }
   else
   {
      if(confirm("Backup '" + backups[foundIndex].name + "' will be removed forever!"))
      {
         console.debug("Removing");
         backups.splice(foundIndex,1);
         await browser.storage.sync.set({"backups": backups});
         displayBackups();
      }
   }
}

async function saveBackup(e)
{
   if(e)
   {
      e.preventDefault();
   }

   const storage = await browser.storage.sync.get("backups");
   const backups = storage.backups;

   const buName = document.querySelector("#newBackupName").value;
   if(buName.length < 1)
   {
      buName = "Untitled";
   }

   let foundIndex = -1;

   for(let i = 0;i < backups.length;i++)
   {
      if(backups[i].name === buName)
      {
         console.debug("Found it at i=" + i);
         foundIndex = i;
         break;
      }
   }

   const storageToSave = await browser.storage.local.get(["version","presets","options","advanced"]);
   if(foundIndex == -1)
   {
      console.debug("Not found, adding it");

      const buNew = {
         "id": makeID(),
         "name": buName,
         "saveTime": new Date().getTime(),
         "storage": storageToSave

      };

      backups.push(buNew);
      await browser.storage.sync.set({"backups": backups});
      displayBackups();
   }
   else
   {
      if(confirm("Existing backup '" + backups[foundIndex].name + "' will be replaced with current options!"))
      {
         console.debug("Updating it");

         backups[foundIndex].saveTime = new Date().getTime();
         backups[foundIndex].storage = storageToSave;
         await browser.storage.sync.set({"backups": backups});
         displayBackups();
      }
   }

   document.querySelector("#newBackupName").value = "";
}


window.addEventListener("resize", updateSizes);
document.addEventListener("DOMContentLoaded", doOnLoad);
document.querySelector("#addNew").addEventListener("click", addPreset);
document.querySelector("#currentSize").addEventListener("click", useCurrentSize);
document.querySelector("#quickResizeInfo").addEventListener("click", _ => alert(QUICK_RESIZE_INFO));
document.querySelector("#useQuickResizeMode").addEventListener("change", setUseQuickResizeMode);
document.querySelector("#keepActionMenuOnClick").addEventListener("change", setKeepActionMenuOnClick);
document.querySelector("#saveNewBackup").addEventListener("click", saveBackup);
document.querySelector("#oversizeAllowance").addEventListener("change", setOversizeAllowance);
document.querySelector("#acceptAdvanced button").addEventListener("click", showAdvanced);
document.querySelector("#resetAdvanced").addEventListener("click", resetAdvanced);

setInterval(updateSizes,300);  // Because the "resize" event doesn't fire unless content is reflowed due to the resize.  Also handles when moving window between different sized screens!
