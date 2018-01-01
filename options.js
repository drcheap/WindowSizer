const PREFIX_EDIT = "edit-";
const PREFIX_REMOVE = "remove-";
const PREFIX_SAVE = "save-";
const PREFIX_CANCEL = "cancel-";
const MODE_NEW = "new";
const MODE_EDIT = "edit";

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

function isNumeric(n)
{
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getId(fullString,prefixToRemove)
{
   return parseInt(fullString.substring(prefixToRemove.length));
}

function getValues(mode)
{
   let hasError = false;

   let eW = document.querySelector("#" + mode + "Width");
   let width = eW.value;
   if(!isNumeric(width) || parseInt(width) > screen.availWidth)
   {
      hasError = true;
      addClass(eW,"invalid");
      eW.value = "";
   }
   else
   {
      removeClass(eW,"invalid");
   }

   let eH = document.querySelector("#" + mode + "Height");
   let height = eH.value;
   if(!isNumeric(height) || parseInt(height) > screen.availHeight)
   {
      hasError = true;
      addClass(eH,"invalid");
      eH.value = "";
   }
   else
   {
      removeClass(eH,"invalid");
   }

   let eN = document.querySelector("#" + mode + "Name");
   let name = eN.value;
   if(name.length < 1)
   {
      hasError = true;
      addClass(eN,"invalid");
      eN.value = "";
   }
   else
   {
      removeClass(eN,"invalid");
   }

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
      result.width = parseInt(width);
      result.height = parseInt(height);
      result.name = name;
   }
   return result;
}

function displayPresets()
{
   browser.storage.local.get("presets").then((obj) => {
      let presets = obj.presets;
      console.log("(display) Loaded " + presets.length + " presets: %o", presets);

      let existingRows = document.querySelectorAll(".presetItem");
      for(let row of existingRows)
      {
         console.log("(display) Remove item row");
         row.remove();
      };

      for(let i = 0;i < presets.length;i++)
      {
         let presetIndex = i + 1;
         console.log("(display) Add item " + presetIndex + ": " + presets[i].name);

         // Make the row
         let tr = document.createElement("tr");
         tr.className = "presetItem";
         tr.innerHTML = '';
         tr.innerHTML += '<td>Alt+' + presetIndex + '</td>';
         tr.innerHTML += '<td>' + presets[i].width + '</td>';
         tr.innerHTML += '<td>' + presets[i].height + '</td>';
         tr.innerHTML += '<td>' + presets[i].name + '</td>';
         tr.innerHTML += '<td><button type="button" id="' + PREFIX_EDIT + presets[i].id + '">Edit</button><button type="button" id="' + PREFIX_REMOVE + presets[i].id + '">Remove</button></td>';
         tr.innerHTML += '<td></td>';

         // Add it
         let lastRow = document.querySelector("#addPreset");
         lastRow.parentNode.insertBefore(tr,lastRow);

         // Add event handlers
         document.querySelector("#" + PREFIX_EDIT + presets[i].id).addEventListener('click', editPreset);
         document.querySelector("#" + PREFIX_REMOVE + presets[i].id).addEventListener('click', removePreset);
      }

      showCurrentSize();
   });
}

function showCurrentSize()
{
   let eCS = document.querySelector("#currentSize");
   eCS.innerHTML = window.outerWidth + "x" + window.outerHeight + " (click to use)";
}

function useCurrentSize()
{
   document.querySelector("#newWidth").value = window.outerWidth;
   document.querySelector("#newHeight").value = window.outerHeight;
}

function addPreset(e)
{
   let values = getValues(MODE_NEW);
   if(values.valid)
   {
      browser.storage.local.get("presets").then((obj) => {
         console.log("(add) Adding preset: " + values.width + "x" + values.height + " " + values.name);
         let item = {
            "id": new Date().valueOf(),      // This is not *perfect* but works as long as two presets aren't created in the same millisecond (o).(O)
            "width": values.width,
            "height": values.height,
            "name": values.name
         };

         let presets = obj.presets;
         presets.push(item);
         browser.storage.local.set({"presets": presets});
         displayPresets();
      });
   }

   e.preventDefault();
}

function editPreset(e)
{
   let myId = getId(e.target.id,PREFIX_EDIT);
   let tr = e.target.parentElement.parentElement;
   let origHotkey = tr.children[0].textContent;
   let origWidth = tr.children[1].textContent;
   let origHeight = tr.children[2].textContent;
   let origName = tr.children[3].textContent;

   // Replace row with editable version
   tr.innerHTML = '';
   tr.innerHTML += '<td>' + origHotkey + '</td>';
   tr.innerHTML += '<td><input type="text" id="editWidth" value="' + origWidth + '" size="4" maxlength="4"></td>';
   tr.innerHTML += '<td><input type="text" id="editHeight" value="' + origHeight + '" size="4" maxlength="4"></td>';
   tr.innerHTML += '<td><input type="text" id="editName" value="' + origName + '" size="15" maxlength="15"></td>';
   tr.innerHTML += '<td><button type="button" id="' + PREFIX_SAVE + myId + '">Save</button><button type="button" id="' + PREFIX_CANCEL + myId + '">Cancel</button></td>';
   tr.innerHTML += '<td id="editStatus"></td>';

   // Add event handlers
   document.querySelector("#" + PREFIX_SAVE + myId).addEventListener('click', saveEdits);
   document.querySelector("#" + PREFIX_CANCEL + myId).addEventListener('click', cancelEdits);
   e.preventDefault();
}

function saveEdits(e)
{
   let values = getValues(MODE_EDIT);
   if(values.valid)
   {

      browser.storage.local.get("presets").then((obj) => {
         let myId = getId(e.target.id,PREFIX_EDIT);
         console.log("(remove) Request to edit id=" + myId);

         let presets = obj.presets;
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

         browser.storage.local.set({"presets": presets});
         displayPresets();
      });
   }

   e.preventDefault();
}

function cancelEdits()
{
   displayPresets();
}

function removePreset(e)
{
   browser.storage.local.get("presets").then((obj) => {
      let myId = getId(e.target.id,PREFIX_REMOVE);
      console.log("(remove) Request to remove id=" + myId);

      let presets = obj.presets;
      for(let i = 0;i < presets.length;i++)
      {
         if(presets[i].id === myId)
         {
            console.log("(remove) Found it at i=" + i);

            presets.splice(i,1); // Removes this item
            break;
         }
      }

      browser.storage.local.set({"presets": presets});
      displayPresets();
   });

   e.preventDefault();
}

// Preset initialization, if needed
browser.storage.local.get("presets").then((obj) => {
   if(!Array.isArray(obj.presets))
   {
      console.log("(init) No presets found, initializing...");
      browser.storage.local.set({"presets": []});
   }
});

window.addEventListener("resize", showCurrentSize);
document.addEventListener("DOMContentLoaded", displayPresets);
document.querySelector("#addNew").addEventListener("click", addPreset);
document.querySelector("#currentSize").addEventListener("click", useCurrentSize);
