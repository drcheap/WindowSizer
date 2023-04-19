const PREFIX_PRESET = "preset-"; // Must match the one in common.js
const PREFIX_EDIT = "edit-";
const PREFIX_RESTORE = "restore-";
const PREFIX_REMOVE = "remove-";
const PREFIX_SAVE = "save-";
const PREFIX_CANCEL = "cancel-";
const PREFIX_DOWN = "down-"
const PREFIX_UP = "up-"
const MODE_NEW = "new";
const MODE_EDIT = "edit";
const OVERSIZE_ALLOWANCE_DEFAULT = 1.1;
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
      let reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
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

   let eW = document.querySelector("#" + mode + "Width");
   let width = parseInt(eW.value);
   if(Number.isInteger(width) && width > 0 && width <= screen.availWidth * oversizeAllowance)
   {
      removeClass(eW,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eW,"invalid");
   }

   let eH = document.querySelector("#" + mode + "Height");
   let height = parseInt(eH.value);
   if(Number.isInteger(height) && height > 0 && height <= screen.availHeight * oversizeAllowance)
   {
      removeClass(eH,"invalid");
   }
   else
   {
      hasError = true;
      addClass(eH,"invalid");
   }

   let eN = document.querySelector("#" + mode + "Name");
   let name = eN.value;

   let result = {"valid": !hasError};
   let eS = document.querySelector("#" + mode + "Status");
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
   let storage = await browser.storage.local.get("options");
   let options = storage.options;

   keepActionMenuOnClick = options.keepActionMenuOnClick !== undefined && options.keepActionMenuOnClick;
   document.querySelector("#keepActionMenuOnClick").checked = keepActionMenuOnClick;
}

async function loadAdvancedSettings()
{
   let storage = await browser.storage.local.get("advanced");
   let advanced = storage.advanced;

   if(advanced.oversizeAllowance !== undefined)
   {
      oversizeAllowance = advanced.oversizeAllowance;
   }
   document.querySelector("#oversizeAllowance").value = oversizeAllowance;
}

async function displayPresets()
{
   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;

   let existingRows = document.querySelectorAll(".presetItem");
   for(let row of existingRows)
   {
      console.log("(displayPreset) Remove item row");
      row.remove();
   };

   let presetCount = presets.length;
   for(let i = 0;i < presetCount;i++)
   {
      let presetNum = i + 1;
      let isFirst = (i == 0);
      let isLast = (i == presetCount - 1);
      console.log("(displayPreset) Add item " + presetNum + ": " + presets[i].name);

      let myId = presets[i].id;

      // Make the row, the annoying but safe way
      let tr = document.createElement("tr");
      tr.className = "presetItem";

      let tdP = document.createElement("td");

      let imgDown = document.createElement("img");
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

      let imgUp = document.createElement("img");
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

      let tdK = document.createElement("td");
      tdK.textContent = await browser.extension.getBackgroundPage().getShortcutKey(PREFIX_PRESET + presetNum);
      tr.appendChild(tdK);

      let tdW = document.createElement("td");
      tdW.textContent = presets[i].width;
      tr.appendChild(tdW);

      let tdH = document.createElement("td");
      tdH.textContent = presets[i].height;
      tr.appendChild(tdH);

      let tdN = document.createElement("td");
      tdN.textContent = presets[i].name;
      tr.appendChild(tdN);

      let tdA = document.createElement("td");

      let btnE = document.createElement("button");
      btnE.type = "button";
      btnE.id = PREFIX_EDIT + myId;
      btnE.textContent = "Edit";
      btnE.addEventListener("click", editPreset);
      tdA.appendChild(btnE);

      let btnR = document.createElement("button");
      btnR.type = "button";
      btnR.id = PREFIX_REMOVE + myId;
      btnR.textContent = "Remove";
      btnR.addEventListener("click", removePreset);
      tdA.appendChild(btnR);

      tr.appendChild(tdA);

      tr.appendChild(document.createElement("td"));

      // Add it to the table
      let lastRow = document.querySelector("#addPreset");
      lastRow.parentNode.insertBefore(tr,lastRow);
   }
}

function showScreenSize()
{
   document.querySelector("#screenSize").textContent = screen.availWidth + "x" + screen.availHeight;
}

async function showCurrentSize()
{
   let currentWindow = await browser.windows.getCurrent();
   document.querySelector("#currentSize").textContent = currentWindow.width + "x" + currentWindow.height + " (click to use)";
}

async function useCurrentSize()
{
   let pendingEdit = document.querySelector("#editStatus");
   let mode = pendingEdit == null ? MODE_NEW : MODE_EDIT;
   let currentWindow = await browser.windows.getCurrent();
   document.querySelector("#" + mode + "Width").value = currentWindow.width;
   document.querySelector("#" + mode + "Height").value = currentWindow.height;
}

async function addPreset(e)
{
   e.preventDefault();

   let values = getValues(MODE_NEW);
   if(values.valid)
   {
      console.log("(add) Adding preset: " + values.width + "x" + values.height + " " + values.name);

      let item = {
         "id": makeID(),
         "width": values.width,
         "height": values.height,
         "name": values.name
      };

      let storage = await browser.storage.local.get("presets");
      let presets = storage.presets;
      presets.push(item);
      await browser.storage.local.set({"presets": presets});
      displayPresets();
   }
}

async function editPreset(e)
{
   e.preventDefault();

   let myId = getId(e.target.id,PREFIX_EDIT);

   let pendingEdit = document.querySelector("#editStatus");
   if(pendingEdit != null)
   {
      // Abort the other & try this one again
      await cancelEdits();
      document.querySelector("#" + PREFIX_EDIT + myId).click();
      return;
   }

   let tr = e.target.parentElement.parentElement;

   // Replace values with editable versions
   let tdW = tr.children[2]
   let inW = document.createElement("input");
   inW.type = "text";
   inW.id = "editWidth";
   inW.value = tdW.textContent;
   inW.size = 4;
   inW.maxLength = 4;
   tdW.textContent = "";
   tdW.appendChild(inW);

   let tdH = tr.children[3]
   let inH = document.createElement("input");
   inH.type = "text";
   inH.id = "editHeight";
   inH.value = tdH.textContent;
   inH.size = 4;
   inH.maxLength = 4;
   tdH.textContent = "";
   tdH.appendChild(inH);

   let tdN = tr.children[4]
   let inN = document.createElement("input");
   inN.type = "text";
   inN.id = "editName";
   inN.value = tdN.textContent;
   inN.size = 15;
   inN.maxLength = 15;
   tdN.textContent = "";
   tdN.appendChild(inN);

   // Offer a different set of actions
   let tdA = tr.children[5];
   tdA.textContent = "";

   let btnS = document.createElement("button");
   btnS.type = "button";
   btnS.id = PREFIX_SAVE + myId;
   btnS.textContent = "Save";
   btnS.addEventListener("click", saveEdits);
   tdA.appendChild(btnS);

   let btnC = document.createElement("button");
   btnC.type = "button";
   btnC.id = PREFIX_CANCEL + myId;
   btnC.textContent = "Cancel";
   btnC.addEventListener("click", cancelEdits);
   tdA.appendChild(btnC);

   let tdS = tr.children[6];
   tdS.id = "editStatus";
}

async function saveEdits(e)
{
   e.preventDefault();

   let values = getValues(MODE_EDIT);
   if(values.valid)
   {
      let myId = getId(e.target.id,PREFIX_EDIT);
      console.log("(edit) Request to edit id=" + myId);

      let storage = await browser.storage.local.get("presets");
      let presets = storage.presets;
      for(let i = 0;i < presets.length;i++)
      {
         if(presets[i].id === myId)
         {
            console.log("(edit) Found it at i=" + i);

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

   let myId = getId(e.target.id,PREFIX_REMOVE);
   console.log("(remove) Request to remove id=" + myId);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   for(let i = 0;i < presets.length;i++)
   {
      if(presets[i].id === myId)
      {
         console.log("(remove) Found it at i=" + i);

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

   let myPos = getId(e.target.id,PREFIX_DOWN);
   console.log("(move) Moving down from " + myPos);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   presets.move(myPos,myPos + 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();
}

async function moveUp(e)
{
   e.preventDefault();

   let myPos = getId(e.target.id,PREFIX_UP);
   console.log("(move) Moving up from " + myPos);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   presets.move(myPos,myPos - 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();
}

async function setKeepActionMenuOnClick()
{
   let storage = await browser.storage.local.get("options");
   let options = storage.options;
   extend(options,{"keepActionMenuOnClick": document.querySelector("#keepActionMenuOnClick").checked});
   await browser.storage.local.set({"options": options});
}

async function setOversizeAllowance()
{
   let storage = await browser.storage.local.get("advanced");
   let advanced = storage.advanced;
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
   showCurrentSize();
   showScreenSize();
}

async function displayBackups()
{
   let storage = await browser.storage.sync.get("backups");
   if(storage.backups === undefined)
   {
      console.log("(displayBackup) Initializing backups storage...");
      storage.backups = [];
      await browser.storage.sync.set({"backups": storage.backups});
   }

   let backups = storage.backups;

   let existingRows = document.querySelectorAll(".backupItem");
   for(let row of existingRows)
   {
      console.log("(displayBackup) Remove item row");
      row.remove();
   };

   let backupCount = backups.length;
   for(let i = 0;i < backupCount;i++)
   {
      let buId = backups[i].id;

      console.log("(displayBackup) Add item " + buId + ": " + backups[i].name);

      let isLast = (i == backupCount - 1);
      let bList = document.querySelector("#backupList");

      let buItem = document.createElement("div");
      buItem.className = "backupItem";

      let btnR = document.createElement("button");
      btnR.type = "button";
      btnR.id = PREFIX_RESTORE + buId;
      btnR.textContent = "Restore";
      btnR.addEventListener("click", backupAction);
      buItem.appendChild(btnR);

      buItem.appendChild(document.createTextNode(" "));

      let btnD = document.createElement("button");
      btnD.type = "button";
      btnD.id = PREFIX_REMOVE + buId;
      btnD.textContent = "Delete";
      btnD.addEventListener("click", backupAction);
      buItem.appendChild(btnD);

      let savedAt = new Date(backups[i].saveTime);
      buItem.appendChild(document.createTextNode(" " + backups[i].name + " (Saved at: " + savedAt.toLocaleString() + ")"));

      bList.appendChild(buItem);
   }
}

function backupAction(e)
{
   e.preventDefault();

   let myId = e.target.id;
   let buId = -1;
   if(myId.startsWith(PREFIX_RESTORE))
   {
      restoreBackup(getId(myId,PREFIX_RESTORE));
   }
   else if(myId.startsWith(PREFIX_REMOVE))
   {
      deleteBackup(getId(myId,PREFIX_REMOVE));
   }
}

async function restoreBackup(buId)
{
   let storage = await browser.storage.sync.get("backups");
   let backups = storage.backups;

   let foundIndex = -1;

   if(buId !== undefined)
   {
      for(let i = 0;i < backups.length;i++)
      {
         if(backups[i].id === buId)
         {
            console.log("(restoreBackup) Found it at i=" + i);
            foundIndex = i;
            break;
         }
      }
   }

   if(foundIndex == -1)
   {
      console.log("(restoreBackup) Not found, no changes made");
   }
   else
   {
      if(confirm("Restoring '" + backups[foundIndex].name + "' will overwrite your current options!"))
      {
         console.log("(restoreBackup) restoring");

         let storageToLoad = backups[foundIndex].storage;
         await browser.storage.local.set(storageToLoad);
         doOnLoad();
      }
   }
}

async function deleteBackup(buId)
{
   let storage = await browser.storage.sync.get("backups");
   let backups = storage.backups;

   let foundIndex = -1;

   if(buId !== undefined)
   {
      for(let i = 0;i < backups.length;i++)
      {
         if(backups[i].id === buId)
         {
            console.log("(deleteBackup) Found it at i=" + i);
            foundIndex = i;
            break;
         }
      }
   }

   if(foundIndex == -1)
   {
      console.log("(deleteBackup) Not found, no changes made");
   }
   else
   {
      if(confirm("Backup '" + backups[foundIndex].name + "' will be removed forever!"))
      {
         console.log("(deleteBackup) Removing");
         backups.splice(foundIndex,1);
         await browser.storage.sync.set({"backups": backups});
         displayBackups();
      }
   }
}

async function saveBackup(e)
{
   e.preventDefault();

   let storage = await browser.storage.sync.get("backups");
   let backups = storage.backups;

   let buName = document.querySelector("#newBackupName").value;
   if(buName.length < 1)
   {
      buName = "Untitled";
   }

   let foundIndex = -1;

   for(let i = 0;i < backups.length;i++)
   {
      if(backups[i].name === buName)
      {
         console.log("(saveBackup) Found it at i=" + i);
         foundIndex = i;
         break;
      }
   }

   let storageToSave = await browser.storage.local.get(["version","presets","options","advanced"]);
   if(foundIndex == -1)
   {
      console.log("(saveBackup) Not found, adding it");

      let buNew = {
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
         console.log("(saveBackup) Updating it");

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
document.querySelector("#keepActionMenuOnClick").addEventListener("change", setKeepActionMenuOnClick);
document.querySelector("#saveNewBackup").addEventListener("click", saveBackup);
document.querySelector("#oversizeAllowance").addEventListener("change", setOversizeAllowance);
document.querySelector("#acceptAdvanced button").addEventListener("click", showAdvanced);
document.querySelector("#resetAdvanced").addEventListener("click", resetAdvanced);

setInterval(updateSizes,300);  // Because the "resize" event doesn't fire unless content is reflowed due to the resize.  Also handles when moving window between different sized screens!
