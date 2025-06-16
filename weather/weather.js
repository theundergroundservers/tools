var fs = require('fs');
const omeagCfgPath = 'Omega.cfg';

let getDay = () => {
    let systemDateTime = new Date();
    let day = systemDateTime.getDate();    
    return day;
}

let getOmegaCfg = () => {
    let obj = JSON.parse(fs.readFileSync(omeagCfgPath, 'utf8'));
    return obj;
}

let writeOmegaCfg = (cfg) => {
    var content = JSON.stringify(cfg, null, 4);
    fs.writeFileSync(omeagCfgPath, content);
}

let main = () => {
    let day = getDay();
    let cfg = getOmegaCfg();

    // Get the mods array
    let mods = cfg['mods'];

    // Find the winter chernarus map
    winterMod = mods.find((mod) => mod['file_id'] == 2981609048);
    summerMod = mods.find((mod) => mod['file_id'] == 1644467354);

    console.log(`The current day of month is ${day}`);

    // days 11 to 17 are 'winter'days. Adjust this if we want
    // more or fewer winter days
    if (day >= 12 && day <= 16) {
        console.log('Enabling winter mode');
        winterMod['disabled'] = false;
        summerMod['disabled'] = true;
    }

    // Days between 21-31 are 'summer' map days
    else if ((day >= 21 && day <= 31) || (day >= 1 && day <= 2)) {

        console.log('Enabling summer mode');

        // make sure the winter map is disabled
        // and the summer map is NOT disabled
        winterMod['disabled'] = true;
        summerMod['disabled'] = false;
    }

    else {
        // it's Fall or Spring - normal map 
        // so disable bloth mods
        console.log('Disabling winter mode');
        winterMod['disabled'] = true;
        summerMod['disabled'] = true;
    }

    // write the file back
    writeOmegaCfg(cfg);
}

main();