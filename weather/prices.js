var fs = require('fs');
const { getDefaultAutoSelectFamily } = require('net');
var path = require('path');
const expansion_mod_path = 'servers/DayZServer/profiles/ExpansionMod/Market';

let getDay = () => {
    var systemDateTime = new Date();
    day = systemDateTime.getDate();    
    return day;
}

let getFile = (filePath) => {
   filePath = path.join(expansion_mod_path, filePath);
   var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
   return obj;
}

let writeFile = (data) => {
   let fileString = ''
   const filename = 'out.csv'

   fileString += Object.keys(data[0]).join(',')

   data.forEach((data) => {
      fileString += '\n' +  Object.values(data).join(',')
   })

   fs.writeFileSync(filename, fileString, 'utf8')
}

let main = () => {
   let records = [];
   const files = fs.readdirSync(expansion_mod_path);
   files.forEach(filePath => {
      if (!filter(filePath)) return;
      let file = getFile(filePath);

      items = file['Items'];

      items.forEach(x => {         
         let buyprice = x['MaxPriceThreshold'];
         let discount = x['SellPricePercent'] / 100;

         let sellprice = 0.0;

         if (discount < 0) {
            sellprice = buyprice * 0.5
         } else {
            sellprice = buyprice * discount;
         }

         category = '';
                  
         let record = {
            filename: filePath,
            classname: x['ClassName'],
            buyprice: buyprice,
            sellprice: sellprice
            
         };

         records.push(record);

      })        
   });
   writeFile(records)
}


let filter = (fileName) => {
   const fullPath = path.join(expansion_mod_path, fileName);
   const stats = fs.statSync(fullPath);
   if (!stats.isFile()) {
      return false
   }

   return true;
}

main();
