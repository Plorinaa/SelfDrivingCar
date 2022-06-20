const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const N = 100;
const cars = generateCars(N);
let bestCar = cars[0];
if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));

        if (i != 0)
            NeuralNetwork.mutate(cars[i].brain, 0.1);
    }
}

let trafficY = -200;
const traffic = [
    new Car(road.getLaneCenter(0), -200, 30, 50, "DUMMY", 1),
    new Car(road.getLaneCenter(1), -200, 30, 50, "DUMMY", 1)
];

for (let i = 0; i < 4; i++) {
    addCarToTraffic();
}

let highestScore = 0,
    lowestScore = 0;

animate();
setTimeout(() => {
    save();
    location.reload();
}, 20 * 1000);

function addCarToTraffic() {
    const firstLane = Math.floor(Math.random() * 3);
    let secondLane = Math.floor(Math.random() * 3);

    const lastCar = traffic[traffic.length - 1];

    while (secondLane == firstLane)
        secondLane = Math.floor(Math.random() * 3);

    traffic.push(
        new Car(road.getLaneCenter(firstLane), lastCar.y - 200, 30, 50, "DUMMY", 1),
        new Car(road.getLaneCenter(secondLane), lastCar.y - 200, 30, 50, "DUMMY", 1)
    );
    trafficY -= 200;
}

function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard() {
    localStorage.removeItem("bestBrain");
}

function generateCars(N) {
    const cars = [];
    for (let i = 0; i <= N; i++)
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));

    return cars;
}

function animate(time) {
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    for (let i = 0; i < cars.length; i++) {
        if (cars[i].damaged) {
            cars.splice(i, 1);
            continue;
        }

        cars[i].update(road.borders, traffic);

        if (cars[i].score > highestScore)
            highestScore = cars[i].score;

        lowestScore = cars.filter(c => c.score == highestScore)
                        .sort((a, b) => a - b)
                        .slice(0, 10)
                        [9];
    }

    for (let i = 0; i < traffic.length; i++) {
        const selectedCar = traffic[i];
        const polyy = [
            { x: carCanvas.width, y: bestCar.polygon[2].y + 100 },
            { x: 0, y: bestCar.polygon[2].y + 100 },
            { x: 0, y: bestCar.polygon[2].y + 250 },
            { x: carCanvas.width, y: bestCar.polygon[2].y + 250 }
        ];

        if (polysIntersect(selectedCar.polygon, polyy)) {
            traffic.splice(i, 1);

            addCarToTraffic();

            for (let j = 0; j < cars.length; j++) {
                cars[j].score++;
            }
        }
    }

    bestCar = cars.find(c => c.y == Math.min(
        ...cars.map(c => c.y)
    ));

    if (highestScore - lowestScore == 4)
        save();

    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    carCtx.save();

    if (cars.length == 0)
        location.reload();
    const yPos = -bestCar.y + carCanvas.height - 50;

    carCtx.translate(0, yPos);

    road.draw(carCtx);
    for (let i = 0; i < traffic.length; i++)
        traffic[i].draw(carCtx, "red");

    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++)
        cars[i].draw(carCtx, "blue");
    carCtx.globalAlpha = 1;

    bestCar.draw(carCtx, "blue", true);

    carCtx.restore();

    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}