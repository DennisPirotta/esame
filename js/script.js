async function getDataFromUrl(url) {
    let data = null
    try{
        const response = await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
        data = await response.json()
    }catch (e) {  }
    return data;
}

let results = []
function findKey(keyToFind,data,...keys){
    Object.keys(data).forEach(key => {

        if (key === keyToFind){
            results.push({
                keys:keys+key,
                obj:data[key]
            })
        }
        else if (typeof data[key] === 'object') findKey(keyToFind, data[key], keys.toString().concat(key + "-"))
    })
}

function buildCards(data){
    let cards = ""
    data.forEach(dato => {
        console.log(dato)
        cards += `<div class="text-center my-4 col-xl-6 col-12-6 col-sm-12 col p-3">
                    <div class="card">
                        <div class="bg-image over-overlay ripple" data-mdb-ripple-color="light">
                            <iframe src="https://maps.google.com/maps?q=${dato["position"][1]},${dato["position"][0]}&t=k&z=15&ie=UTF8&iwloc=&output=embed" class="w-100" height="400" loading="lazy" style="visibility: hidden;z-index: -1" onload="toggleLoad(this,${data.indexOf(dato)})"></iframe>
                            <lottie-player src="../img/data.json"  background="transparent" id="loading_${data.indexOf(dato)}" speed="1"  style="width: 300px; height: 300px;z-index: 1" class="forced-center" loop autoplay></lottie-player>
                           
                        </div>
                        <div class="card-body">    
                            <h5 class="card-title">Titolo</h5>
                            <p class="card-text">
                                ${dato["value"].toString()}
                            </p>
                        </div>
                        <div class="card-footer">${dato["date"]}</div>
                    </div>
                </div>
               `
    })
    return cards
}

function toggleLoad(iframe,loading){
    iframe.style.visibility = "visible"
    $(`#loading_${loading}`).hide()
}

function get(key,source){

    let obs = []

    findKey(key,source)
    let res = results
    results = []

    Object.keys(res).forEach(key => {
        let index = res[key]["keys"].split("-")[0]
        let entity = res[key]["obj"]
        let date = new Date(source[index]["createdAt"])
        let pos = source[index]["position"]["coordinates"]
        let year = date.getFullYear()

        let info = {
            date: date,
            value: entity,
            year: year,
            position: pos
        }

        obs.push(info)

    })
    return obs
}

function getChartData(info){

    let labels = []
    let dates = []
    info.forEach(i => {
        if ( i["value"] !== undefined  && typeof i["value"] !== 'object'){
            labels.push(i["date"].getDate()+" "+i["date"].toLocaleString('it', {  month: 'long' }))
            dates.push(i["value"])
        }
    })

    return {
        labels: labels,
        datasets: [{
            label: "temperatura",
            data: dates,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }
        ]
    }
}

function findMaxMinAvg(arrayData){
    let min = 5000
    let max = 0
    let med = 0
    arrayData.forEach(dato => {
        if (dato < min) min = dato
        if (dato > max) max = dato
        med += dato
    })
    med = med / arrayData.length
    return JSON.parse(`{"max":${max},"min":${min},"avg":${med.toFixed(1)}}`)
}

function groupBy(array, key){
    return array.reduce((result, currentItem) => {
        (result[currentItem[key]] = result[currentItem[key]] || []).push( currentItem )
        return result
    }, {})
}

function buildCharts(data){
    Object.keys(data).forEach(key => {
        let chartData = getChartData(data[key])

        console.log(data[key])
        let values = findMaxMinAvg(chartData.datasets[0].data)

        $("#temperatureContainer").append(`
                  <section class="mb-4">
                          <div class="card">
                            <div class="card-header py-3">
                              <h5 class="mb-0 text-center"><strong>${key}</strong></h5>
                            </div>
                            <div class="card-body">
                              <canvas id='chart_${key}'></canvas>
                            </div>
                            <div class="card-footer text-center">
                                <p>
                                    <i class="bi bi-caret-up-fill"></i>
                                    <b class="text-danger me-2">${values["max"]}º</b>
                                    <i class="bi bi-caret-down-fill"></i>
                                    <b class="text-primary me-2">${values["min"]}º</b>
                                    <i class="bi bi-caret-right-fill"></i>
                                    <b class="text-success">${values["avg"]}º</b>
                                </p>
                            </div>
                          </div>
                  </section>
                `)


        const ctx = $(`#chart_${key}`)[0].getContext('2d')

        new Chart(
            ctx,
            {
                type: "line",
                data: chartData,
            }
        )
    })
}
