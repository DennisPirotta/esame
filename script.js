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

function buildCards(data){

    let layout = '<div class="row">'

    for (let i = 0; i < Object.keys(data).length; i++) {
        let datetime = new Date(data[i]["date"])
        layout += `        <div class="col-xl-4 col-sm-6 col-12 mb-4" id="${data[i]["_id"]}">
                                <div class="card text-center " style="background-color:#ffffff;">
                                    <div class="card-body">
                                        <!--
                                            <div class="align-self-center">
                                                <i class="fas fa-pencil-alt text-info fa-3x"></i>
                                            </div>
                                            -->
                                            <div class="card-text" id="content_${data[i]["_id"]}">
                                                
                                            </div>
                                            <!--
                                            <div class="text-end">
                                                <h3>${i+1} / ${Object.keys(data).length}</h3>
                                                <p class="mb-0 fs-6">${data[i]["_id"]+1}</p>
                                            </div>
                                            -->
                                    </div>
                                    <div class="card-footer fw-light">
                                        ${datetime.toLocaleString()}
                                    </div>
                                </div>
                           </div>`
    }

    return layout+"</div>"
}

let str = ""
function logData(data,target,...keys){
    Object.keys(data).forEach(key => {
        if(typeof data[key] === 'object' && data[key] !== null)
            logData(data[key],target,keys.toString().concat(key+"-"))
        else{
            $("#content_"+target).append(`
                                <div class="mb-3 form-floating">
                                    <input type="text" class="form-control ${keys}${key}" id="input_${target}_${keys}${key}" value="${data[key]}">
                                    <label class="form-label" for="input_${target}_${keys}${key}">${keys}${key}</label>
                                </div>
                                `)
        }
    })
    str = ""
}

function getTemperatures(data){
    let obs = []

    data.forEach(dato => {
        let temperature = dato["weather"]["temperature"]
        let date = new Date(dato["createdAt"])
        let year = date.getFullYear()

        let info = {
            date: date,
            value: temperature,
            year: year
        }

        obs.push(info)

    })
    return obs
}

function getChartData(info){

    let labels = []
    let dates = []
    info.forEach(i => {
        if ( i["value"] !== undefined ){
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
    let min = 500
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

async function init(){
    let response = await getDataFromUrl("https://api-simile.como.polimi.it/v1/observations")
    let data = response["data"]
    const temperatures = groupBy(getTemperatures(data),"year")

    let i = 0
    Object.keys(temperatures).forEach(key => {
        $("#temperatureContainer").append(`
                  <section class="mb-4">
                          <div class="card">
                            <div class="card-header py-3">
                              <h5 class="mb-0 text-center"><strong>${key}</strong></h5>
                            </div>
                            <div class="card-body">
                              <canvas id='chart${i}'></canvas>
                            </div>
                          </div>
                  </section>
                `)
        let chartData = getChartData(temperatures[key])
        new Chart(
            document.getElementById(`chart${i}`).getContext('2d'),
            {
                type: "line",
                data: chartData,
            }
        )
        i++
    })
}

$(document).ready(init())