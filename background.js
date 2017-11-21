function handleCommand(command)
{
   console.log("(background) handling command: " + command);

   if(command.startsWith(PRESET_PREFIX))
   {
      browser.storage.local.get("presets").then((obj) => {
         if(obj != undefined)
         {
            let presets = obj.presets;
            let presetNum = parseInt(command.substring(PRESET_PREFIX.length));
            if(presetNum <= presets.length)
            {
               let presetId = presets[presetNum - 1].id;
               applyPreset(presetId);
            }
         }
      });
   }
}

browser.commands.onCommand.addListener(handleCommand);
