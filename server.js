import express from "express"
import createClient from "oebb-hafas"

const oebb = createClient('Chrome')
const hostname = "localhost", port = 8080;

const server = express();
const serverRoot = "html";

const config = {
    durationInM: 360,
    includeBuses: false,
    includeActualOnlyWhenDelayed: true
}

//todo: implement more filters to be selectable by client side wip
//todo: add textfield for station selection by client done
//todo: finish arrivals

server.use((req, res, next) =>
{
    console.log("request from received:  " + req.socket.remoteAddress + "\t" + req.method + " " + req.url)

    next();
})

server.get("/departures", departureHandler)
server.get("/arrivals", arrivalHandler)
server.get("/journey", journeyHandler)

server.use(express.static(serverRoot));

server.listen(port, hostname, () =>
{
    console.log(`server running at http://${hostname}:${port}`);
})

async function departureHandler(req, res)
{
    let departures;

    const options = {
        // todo: products
        mode: "train",
        when: new Date(),
        direction: null, // only show departures heading to this station
        duration: config.durationInM, // show departures for the next n minutes
        results: null, // max. number of results; `null` means "whatever HAFAS wants"
        subStops: true, // parse & expose sub-stops of stations?
        entrances: true, // parse & expose entrances of stops/stations?
        linesOfStops: false, // parse & expose lines at the stop/station?
        remarks: true, // parse & expose hints & warnings?
        language: 'de' // language to get results in
    }

    let station = (await oebb.locations(req.headers['x-station']))[0]

    try
    {
        departures = await oebb.departures(station.id, options)
    }
    catch(e)
    {
        console.log('Error: ' + e.message)
    }
    for (let dep of departures)
    {
        let actualDate = new Date(dep.when)
        let planDate = new Date(actualDate - dep.delay * 1000)

        let delayed = actualDate.getTime() != planDate.getTime()

        if(config.includeBuses || !dep.line.name.includes('Bus'))
            res.write(planDate.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }) + ";" + (config.includeActualOnlyWhenDelayed && !delayed ? "" : actualDate.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }))  + ";" + (dep.platform == null ? "N/A" : dep.platform) + ";" + dep.line.name.split(' (')[0] + ";" + dep.direction + ";" + dep.stop.name + "\n")
    }

    res.end();
}

async function arrivalHandler(req, res)
{
    let arrivals;

    const options = {
        // todo: products
        mode: "train",
        when: new Date(),
        direction: null, // only show departures heading to this station
        duration: config.durationInM, // show departures for the next n minutes
        results: null, // max. number of results; `null` means "whatever HAFAS wants"
        subStops: true, // parse & expose sub-stops of stations?
        entrances: true, // parse & expose entrances of stops/stations?
        linesOfStops: false, // parse & expose lines at the stop/station?
        remarks: true, // parse & expose hints & warnings?
        language: 'de' // language to get results in
    }

    let station = (await oebb.locations(req.headers['x-station']))[0]

    try
    {
        arrivals = (await oebb.arrivals(station.id, options))
    }
    catch(e)
    {
        console.log('Error: ' + e.message)
    }

    for (let arr of arrivals)
    {
        let actualDate = new Date(arr.when)
        let planDate = new Date(actualDate - arr.delay * 1000)

        res.write(planDate.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }) + ";" + actualDate.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }) + ";" + (arr.platform == null ? "N/A" : arr.platform) + ";" + arr.line.name.split(' (')[0] + ";" + arr.direction + ";" + arr.stop.name + "\n")
    }

    res.end();
}

async function journeyHandler(req, res)
{
    let journeys;
    let journeyLegs;
    let joruneyNr;

    let depStation = (await oebb.locations(req.headers['x-dep-station']))[0]
    let arrStation = (await oebb.locations(req.headers['x-arr-station']))[0]

    try
    {
        journeys = await oebb.journeys(depStation.id, arrStation.id)
    }
    catch(e)
    {
        console.log('Error: ' + e.message)
    }

    joruneyNr = (req.headers['x-departure-nr'] == undefined ? 0 : req.headers['x-departure-nr']);

    journeyLegs = journeys.journeys[joruneyNr].legs;

    for(let leg of journeyLegs)
    {
        let localDep = new Date(leg.departure)
        let localArr = new Date(leg.arrival)

        res.write(localDep.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }) + ';' + leg.origin.name + ';' + localArr.toLocaleString('de-AT', { hour: 'numeric', minute: 'numeric' }) + ';' + leg.destination.name + ';' + (leg.line == undefined ? "walking" : leg.line.name.split(' (')[0]) + '\n')
    }
    
    res.end();
}