const axios = require('axios');
const { load } = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const pointSchema = new mongoose.Schema({
    data:{
        type: Object,
        required: true
    }
},{timestamps:true});

const PointsTable = mongoose.model('PointsTable', pointSchema);

async function scrape() {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
        'Accept-Encoding': 'none',
        'Accept-Language': 'en-US,en;q=0.8,en-GB;q=0.6,en-AU;q=0.4'
    }
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
        await PointsTable.create({data:pointsTable});
        await mongoose.disconnect();        
}

scrape();