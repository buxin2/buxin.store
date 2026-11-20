/**
 * Add Gambia-available component kits into the catalogue + store-data gambiaIds.
 * Pack rules: LED ×500, jumper wires ×500, everything else ×5.
 * Prices are dalasi (priceCurrency: GMD). Colour Sensor + Relay have no price yet.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CAT = "Components in The Gambia";

function pack(qty, unitPrice) {
  return Math.round(Number(unitPrice) * Number(qty));
}

function desc(body, qty, unitLabel) {
  return [
    body.trim(),
    "",
    `This listing is a pack of ${qty} ${unitLabel}.`,
    "Available in The Gambia — buy today, get it today. No shipping fee.",
    "Photo coming soon. Message us on WhatsApp if you need help choosing parts for your project."
  ].join("\n");
}

const kits = [
  {
    id: "GM-KIT-01",
    name: "Battery Holder Pack (5)",
    title: "Battery Holder · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 175,
    unitLabel: "battery holders",
    body: "Battery holders for powering Arduino, ESP32, robot cars, and classroom electronics projects. Suitable for common AA/AAA style holder setups used in DIY kits."
  },
  {
    id: "GM-KIT-02",
    name: "Ultrasonic Sensor Pack (5)",
    title: "Ultrasonic Distance Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 425,
    unitLabel: "ultrasonic sensors",
    body: "HC-SR04 style ultrasonic sensors for distance measurement, obstacle avoidance, parking assistants, and smart robot projects."
  },
  {
    id: "GM-KIT-03",
    name: "Motor Driver Pack (5)",
    title: "Motor Driver Module · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 450,
    unitLabel: "motor drivers",
    body: "Motor driver boards for controlling DC gear motors on robot cars and mobile platforms. Useful with Arduino Nano and ESP32 builds."
  },
  {
    id: "GM-KIT-04",
    name: "Humidity Sensor Pack (5)",
    title: "Humidity Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 325,
    unitLabel: "humidity sensors",
    body: "Humidity and temperature sensing modules for weather stations, greenhouse monitors, and science experiment kits."
  },
  {
    id: "GM-KIT-05",
    name: "IR Sensor Pack (5)",
    title: "IR Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 250,
    unitLabel: "IR sensors",
    body: "Infrared sensors for obstacle detection, object sensing, and basic automation projects with microcontrollers."
  },
  {
    id: "GM-KIT-06",
    name: "Arduino Nano Pack (5)",
    title: "Arduino Nano · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 450,
    unitLabel: "Arduino Nano boards",
    body: "Arduino Nano boards for learning electronics, coding, sensors, motors, and school STEM projects. Compact and easy to use on a breadboard."
  },
  {
    id: "GM-KIT-07",
    name: "Joystick Module Pack (5)",
    title: "Joystick Module · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 200,
    unitLabel: "joystick modules",
    body: "Analog joystick modules for robot control, game-style inputs, pan-tilt mounts, and interactive Arduino projects."
  },
  {
    id: "GM-KIT-08",
    name: "Gas Sensor Pack (5)",
    title: "Gas Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 425,
    unitLabel: "gas sensors",
    body: "Gas sensor modules for air-quality demos, safety experiments, and classroom science projects with Arduino or ESP32."
  },
  {
    id: "GM-KIT-09",
    name: "Servo Motor Pack (5)",
    title: "Servo Motor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 175,
    unitLabel: "servo motors",
    body: "Standard hobby servo motors for arms, steering, gates, camera mounts, and moving parts in DIY mechatronics kits."
  },
  {
    id: "GM-KIT-10",
    name: "Potentiometer Pack (5)",
    title: "Potentiometer · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 75,
    unitLabel: "potentiometers",
    body: "Rotary potentiometers for volume-style controls, analog input practice, brightness control, and adjustable thresholds in circuits."
  },
  {
    id: "GM-KIT-11",
    name: "USB Cable for Arduino Nano Pack (5)",
    title: "USB Cable for Arduino Nano · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 150,
    unitLabel: "USB cables for Arduino Nano",
    body: "USB cables for programming and powering Arduino Nano boards. Keep spares ready for class sets and workshops."
  },
  {
    id: "GM-KIT-12",
    name: "LED Light Pack (500)",
    title: "LED Lights · Pack of 500 · Available in The Gambia",
    qty: 500,
    unit: 10,
    unitLabel: "LED lights",
    body: "Assorted LED lights for indicators, traffic-light demos, displays, and beginner electronics. Large classroom pack."
  },
  {
    id: "GM-KIT-13",
    name: "Push Button Pack (5)",
    title: "Push Button · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 50,
    unitLabel: "push buttons",
    body: "Tactile push buttons for user inputs, start/stop controls, and simple interactive Arduino circuits."
  },
  {
    id: "GM-KIT-14",
    name: "Tire Pack (5)",
    title: "Robot Tires · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 100,
    unitLabel: "tires",
    body: "Rubber tires for small robot cars and gear-motor wheels. Use with matching gear motors for mobile STEM builds."
  },
  {
    id: "GM-KIT-15",
    name: "Gear Motor Pack (5)",
    title: "Gear Motor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 125,
    unitLabel: "gear motors",
    body: "DC gear motors for robot cars, conveyors, and moving platforms. Pair with a motor driver and tires."
  },
  {
    id: "GM-KIT-16",
    name: "5V Buzzer Pack (5)",
    title: "5V Buzzer · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 75,
    unitLabel: "5V buzzers",
    body: "5V buzzers for alarms, alerts, doorbell demos, and sound feedback in microcontroller projects."
  },
  {
    id: "GM-KIT-17",
    name: "Transistor Pack (5)",
    title: "Transistor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 30,
    unitLabel: "transistors",
    body: "Transistors for switching loads, amplifying signals, and basic electronics lessons with Arduino and discrete circuits."
  },
  {
    id: "GM-KIT-18",
    name: "Capacitor Pack (5)",
    title: "Capacitor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 50,
    unitLabel: "capacitors",
    body: "Capacitors for filtering, timing circuits, and power smoothing on breadboard and PCB projects."
  },
  {
    id: "GM-KIT-19",
    name: "Caster Wheel Pack (5)",
    title: "Caster Wheel · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 164,
    unitLabel: "caster wheels",
    body: "Swivel caster wheels for three-wheel robot chassis and free-turning support on DIY robot cars."
  },
  {
    id: "GM-KIT-20",
    name: "Jumper Wires Pack (500)",
    title: "Jumper Wires · Pack of 500 · Available in The Gambia",
    qty: 500,
    // Listed as 10 pieces = D20 → D2 each
    unit: 2,
    unitLabel: "jumper wires",
    body: "Breadboard jumper wires for connecting sensors, modules, and Arduino boards. Large pack for classrooms and workshops."
  },
  {
    id: "GM-KIT-21",
    name: "ESP32 Pack (5)",
    title: "ESP32 Development Board · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 1200,
    unitLabel: "ESP32 boards",
    body: "ESP32 boards with Wi-Fi and Bluetooth for IoT projects, smart sensors, wireless control, and advanced STEM builds."
  },
  {
    id: "GM-KIT-22",
    name: "Buck Converter Pack (5)",
    title: "Buck Converter · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 300,
    unitLabel: "buck converters",
    body: "Step-down buck converters for supplying stable lower voltages to microcontrollers, sensors, and robot electronics."
  },
  {
    id: "GM-KIT-23",
    name: "Line Following Sensor Pack (5)",
    title: "Line Following Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 200,
    unitLabel: "line following sensors",
    body: "Line-following sensors for robot cars that track black/white paths in competitions and classroom robotics."
  },
  {
    id: "GM-KIT-24",
    name: "Bluetooth Module Pack (5)",
    title: "Bluetooth Module · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 600,
    unitLabel: "Bluetooth modules",
    body: "Bluetooth modules for wireless phone control of robots, data links, and remote Arduino projects."
  },
  {
    id: "GM-KIT-25",
    name: "Resistor Pack (5)",
    title: "Resistor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: 10,
    unitLabel: "resistors",
    body: "Resistors for current limiting with LEDs, pull-up/pull-down inputs, and everyday circuit building."
  },
  {
    id: "GM-KIT-26",
    name: "Colour Sensor Pack (5)",
    title: "Colour Sensor · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: null,
    unitLabel: "colour sensors",
    body: "Colour sensor modules for sorting, line/colour detection demos, and interactive Arduino or ESP32 projects. Ask on WhatsApp for the current dalasi price."
  },
  {
    id: "GM-KIT-27",
    name: "Relay Pack (5)",
    title: "Relay Module · Pack of 5 · Available in The Gambia",
    qty: 5,
    unit: null,
    unitLabel: "relay modules",
    body: "Relay modules for switching lights, fans, pumps, and higher-power loads safely from a microcontroller. Ask on WhatsApp for the current dalasi price."
  }
];

const products = kits.map((k) => {
  const priced = k.unit != null;
  const price = priced ? pack(k.qty, k.unit) : 0;
  const priceLine = priced
    ? `Pack price: D${price} (${k.qty} × D${k.unit}).`
    : "Price: ask on WhatsApp.";
  return {
    id: k.id,
    name: k.name,
    title: k.title,
    price,
    priceCurrency: "GMD",
    description: desc(`${k.body}\n\n${priceLine}`, k.qty, k.unitLabel),
    image: "",
    category: CAT
  };
});

const productsPath = path.join(ROOT, "js", "products-data.js");
const storePath = path.join(ROOT, "js", "store-data.js");

const raw = fs.readFileSync(productsPath, "utf8");
const start = raw.indexOf("[");
if (start < 0) throw new Error("CATALOG_PRODUCTS array not found");
const catalog = JSON.parse(raw.slice(start).replace(/;\s*$/, ""));
const withoutOld = catalog.filter((p) => !String(p.id || "").startsWith("GM-KIT-"));
const next = withoutOld.concat(products);
fs.writeFileSync(
  productsPath,
  "window.CATALOG_PRODUCTS = " + JSON.stringify(next, null, 2) + ";\n",
  "utf8"
);

const store = Function("return " + fs.readFileSync(storePath, "utf8").replace(/^window\.STORE_DATA\s*=\s*/, "").replace(/;\s*$/, ""))();
const ids = products.map((p) => p.id);
const prev = Array.isArray(store.gambiaIds) ? store.gambiaIds.map(String) : [];
store.gambiaIds = [...new Set([...prev.filter((id) => !id.startsWith("GM-KIT-")), ...ids])];
store.updatedAt = new Date().toISOString();
fs.writeWrite = null;
fs.writeFileSync(storePath, "window.STORE_DATA = " + JSON.stringify(store, null, 2) + ";\n", "utf8");

console.log(
  JSON.stringify(
    {
      catalogCount: next.length,
      added: products.length,
      gambiaIds: store.gambiaIds.length,
      priced: products.filter((p) => p.price > 0).map((p) => ({ id: p.id, name: p.name, price: p.price })),
      askPrice: products.filter((p) => !p.price).map((p) => p.id)
    },
    null,
    2
  )
);
