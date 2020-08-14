document.addEventListener('DOMContentLoaded', main)

const depStation = 'Kleblach-Lind'
const arrStation = 'Klagenfurt Hbf'

let clock;

const maxTableSize = 25;
const timetableId = "timetable"

const journeytableId = "journeytable"

function main()
{
    drawTimetable();
    drawJourneyTable();

    clock = document.getElementById('clock');

    window.setInterval(drawTimetable, 45000)
    window.setInterval(updateClock, 250)
}

async function updateClock()
{
    let currentDate = new Date();

    clock.textContent = currentDate.toLocaleTimeString('de-AT');
}

async function updateStation(name)
{
    let stationP = document.getElementById('station');

    stationP.textContent = "Station: " + name;
}

function clearTable()
{
    document.getElementById(timetableId).innerHTML = '';
}

function drawTimetable()
{
    let request = new XMLHttpRequest();
    let buffer = null

    request.open('GET', '/departures');
    request.setRequestHeader('x-station', depStation)

    request.onreadystatechange = function ()
    {
        if (request.readyState == 4 && request.status == 200)
        {
            clearTable();

            drawTableFromCSV(request.responseText)
        }
    };

    request.send();
}

function drawTableFromCSV(csv)
{
    const delimiter = ";"

    let table = document.getElementById(timetableId)
    let lines = csv.split('\n')
    let parts;

    let tr = document.createElement('tr')

    tr.innerHTML = "<th>Plan</th><th>Aktuell</th><th>Bahnsteig</th><th>Zug</th><th>Nach</th><th>Von</th>"

    table.appendChild(tr);

    for (let cnt = 0; cnt < lines.length&& cnt < maxTableSize; cnt++)
    {
        parts = lines[cnt].split(delimiter)
        tr = document.createElement('tr');

        for (let innerCnt = 0; innerCnt < parts.length; innerCnt++)
        {
            let td = document.createElement('td');
            td.textContent = parts[innerCnt]

            tr.appendChild(td);
        }

        if (cnt % 2 == 0)
            tr.style.backgroundColor = '#00006F'

        table.appendChild(tr);
    }

    updateStation(depStation);
}

function clearJourneyTable()
{
    
}

function drawJourneyTable()
{
    let request = new XMLHttpRequest();
    
    request.open('GET', '/journey');
    request.setRequestHeader('x-dep-station', depStation)
    request.setRequestHeader('x-arr-station', arrStation)

    request.onreadystatechange = function ()
    {
        if (request.readyState == 4 && request.status == 200)
        {
            console.log(request.responseText)
        }
    };

   request.send();
}