const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const pointSchema = new mongoose.Schema({
    data:Object
},{timestamps:true});

const PointsTable = mongoose.model('PointsTable', pointSchema);

async function scrape() {
    const url="https://www.espncricinfo.com/series/ipl-2025-1449924/points-table-standings";
        const response = await axios.get(url, { headers });
        const $ = load(response.data);
        const pointsTable = {};
        const IPLTable =$('table.ds-w-full').first();
        IPLTable.find('tbody tr').each((index, row) => {
            const cols = $(row).find('td');
            if(cols.length >= 9){
                let team;
                let form='';
                if(index==18){
                    team = $(cols[0]).text().trim().substring(2);
                }
                else{
                    team = $(cols[0]).text().trim().substring(1);
                }
                const pos=(index/2)+1;
    
                //complex form data
                const dt=$(cols[8]).find('span');
                for(let i=0;i<dt.length;i++){
                    form+=dt.eq(i).text().trim();
                    if(i<dt.length-1){
                        form+=' ';
                    }
                }
                const lasts=form.split(' ').filter(r => ['W'].includes(r));
                pointsTable[team] = { position: pos, wins_last5: lasts.length };
            }
        })
        await mongoose.connect(MONGODB_URI);
        await PointsTable.deleteMany({});
        await PointsTable.create(pointsTable);
        await mongoose.disconnect();        
}

scrape();