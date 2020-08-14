document.addEventListener('DOMContentLoaded', main)

let depStation = 'Kleblach-Lind'
let arrStation = 'Tauchendorf-Haidensee'

let clock;

const maxTableSize = 25;
const timetableId = "timetable"

const journeytableDivId = "journeytables"

function main()
{
    refreshInfo()

    clock = document.getElementById('clock');

    window.setInterval(drawTimetable, 60000)
    window.setInterval(drawMultipleJourneyTables, 300000)
    window.setInterval(updateClock, 250)

    document.getElementById('apply').addEventListener('click', applySettings)
}

async function refreshInfo()
{
    drawTimetable();
    drawMultipleJourneyTables();
}

async function updateClock()
{
    let currentDate = new Date();

    clock.textContent = currentDate.toLocaleTimeString('de-AT');
}

async function updateStation(dep, arr)
{
    let stationP = document.getElementById('station');

    stationP.textContent = dep + " -> " + arr;
}

function clearTable()
{
    document.getElementById(timetableId).innerHTML = '';
}

function applySettings()
{
    let depInput = document.getElementById('depStationTxt')
    let arrInput = document.getElementById('arrStationTxt')

    let newDep = depInput.value;
    let newArr = arrInput.value;

    if(newDep != "")
    {
        depStation = newDep;
        depInput.style.borderColor = 'initial'
    }
    else
    {
        depInput.style.borderColor = 'red'
    }

    if(newArr != "")
    {
        arrStation = newArr;
        arrInput.style.borderColor = 'initial'
    }
    else
    {
        arrInput.style.borderColor = 'red'
    }

    refreshInfo();
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

    updateStation(depStation, arrStation);
}

function clearJourneyTables()
{
    document.getElementById(journeytableDivId).innerHTML = '';
}

function drawMultipleJourneyTables(number = 3)
{
    clearJourneyTables();

    for(let cnt = 0; cnt < number; cnt++)
    {
        drawJourneyTable(cnt, true)
    }
}

function drawJourneyTable(depNr = 0, multiple = false)
{
    let request = new XMLHttpRequest();
    
    request.open('GET', '/journey');
    request.setRequestHeader('x-dep-station', depStation)
    request.setRequestHeader('x-arr-station', arrStation)
    request.setRequestHeader('x-departure-nr', depNr)

    request.onreadystatechange = function ()
    {
        if (request.readyState == 4 && request.status == 200)
        {
            if(!multiple)
                clearJourneyTables();

            drawJourneyTableFromCSV(request.responseText)
        }
    };

   request.send();
}

function drawJourneyTableFromCSV(csv)
{
    const delimiter = ";"

    let table = document.createElement('table')
    let lines = csv.split('\n')
    let parts;

    let tr = document.createElement('tr')

    tr.innerHTML = "<th>Abfahrt</th><th>Von</th><th>Ankunft</th><th>In</th><th>Linie</th>"

    table.appendChild(tr);

    for (let cnt = 0; cnt < lines.length; cnt++)
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

    document.getElementById(journeytableDivId).appendChild(table)
}