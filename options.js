const PREFIX_PRESET = "preset-"; // Must match the one in common.js
const PREFIX_EDIT = "edit-";
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

   keepActionMenuOnClick = storage.options.keepActionMenuOnClick !== undefined && storage.options.keepActionMenuOnClick;
   document.querySelector("#keepActionMenuOnClick").checked = keepActionMenuOnClick;
}

async function loadAdvancedSettings()
{
   let storage = await browser.storage.local.get("advanced");
   let advanced = storage.advanced;

   if(storage.advanced.oversizeAllowance !== undefined)
   {
      oversizeAllowance = storage.advanced.oversizeAllowance;
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
      console.log("(display) Remove item row");
      row.remove();
   };

   let presetCount = presets.length;
   for(let i = 0;i < presetCount;i++)
   {
      let presetNum = i + 1;
      let isFirst = (i == 0);
      let isLast = (i == presetCount - 1);
      console.log("(display) Add item " + presetNum + ": " + presets[i].name);

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
         imgDown.addEventListener('click', moveDown);
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
         imgUp.addEventListener('click', moveUp);
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
      btnE.addEventListener('click', editPreset);
      tdA.appendChild(btnE);

      let btnR = document.createElement("button");
      btnR.type = "button";
      btnR.id = PREFIX_REMOVE + myId;
      btnR.textContent = "Remove";
      btnR.addEventListener('click', removePreset);
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
   let values = getValues(MODE_NEW);
   if(values.valid)
   {
      console.log("(add) Adding preset: " + values.width + "x" + values.height + " " + values.name);

      let item = {
         "id": new Date().valueOf(),      // This is not *perfect* but works as long as two presets aren't created in the same millisecond (o).(O)
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

   e.preventDefault();
}

async function editPreset(e)
{
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
   btnS.addEventListener('click', saveEdits);
   tdA.appendChild(btnS);

   let btnC = document.createElement("button");
   btnC.type = "button";
   btnC.id = PREFIX_CANCEL + myId;
   btnC.textContent = "Cancel";
   btnC.addEventListener('click', cancelEdits);
   tdA.appendChild(btnC);

   let tdS = tr.children[6];
   tdS.id = "editStatus";

   e.preventDefault();
}

async function saveEdits(e)
{
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

   e.preventDefault();
}

async function cancelEdits()
{
   // displayPresets() will take care of this by reloading everything
   await displayPresets();
}

async function removePreset(e)
{
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

   e.preventDefault();
}

async function moveDown(e)
{
   let myPos = getId(e.target.id,PREFIX_DOWN);
   console.log("(move) Moving down from " + myPos);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   presets.move(myPos,myPos + 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();

   e.preventDefault();
}

async function moveUp(e)
{
   let myPos = getId(e.target.id,PREFIX_UP);
   console.log("(move) Moving up from " + myPos);

   let storage = await browser.storage.local.get("presets");
   let presets = storage.presets;
   presets.move(myPos,myPos - 1);
   await browser.storage.local.set({"presets": presets});
   displayPresets();

   e.preventDefault();
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
   document.querySelector("#acceptAdvanced").style.display = 'none';
   document.querySelector("#theAdvanced").style.display = 'block';
}

async function doOnLoad()
{
   loadOptions();
   loadAdvancedSettings();
   displayPresets();
   showScreenSize();
}

async function updateSizes()
{
   showCurrentSize();
   showScreenSize();
}

window.addEventListener("resize", updateSizes);
document.addEventListener("DOMContentLoaded", doOnLoad);
document.querySelector("#addNew").addEventListener("click", addPreset);
document.querySelector("#currentSize").addEventListener("click", useCurrentSize);
document.querySelector("#keepActionMenuOnClick").addEventListener("change", setKeepActionMenuOnClick);
document.querySelector("#oversizeAllowance").addEventListener("change", setOversizeAllowance);
document.querySelector("#acceptAdvanced button").addEventListener("click", showAdvanced);
document.querySelector("#resetAdvanced").addEventListener("click", resetAdvanced);

setInterval(updateSizes,300);  // Because the "resize" event doesn't fire unless content is reflowed due to the resize.  Also handles when moving window between different sized screens!
