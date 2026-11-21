/**
 * Gambia-available components. Prices are the exact dalasi amounts provided — no pack multipliers.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CAT = "Components in The Gambia";

function desc(body) {
  return [
    body.trim(),
    "",
    "Available in The Gambia — buy today, get it today. No shipping fee.",
    "Photo coming soon. Message us on WhatsApp if you need help choosing parts for your project."
  ].join("\n");
}

const kits = [
  {
    id: "GM-KIT-01",
    name: "Battery Holder",
    title: "Battery Holder · Available in The Gambia",
    price: 175,
    body: "Battery holder for powering Arduino, ESP32, robot cars, and classroom electronics projects. Suitable for common AA/AAA style holder setups used in DIY kits."
  },
  {
    id: "GM-KIT-02",
    name: "Ultrasonic Sensor",
    title: "Ultrasonic Distance Sensor · Available in The Gambia",
    price: 425,
    body: "HC-SR04 style ultrasonic sensor for distance measurement, obstacle avoidance, parking assistants, and smart robot projects."
  },
  {
    id: "GM-KIT-03",
    name: "Motor Driver",
    title: "Motor Driver Module · Available in The Gambia",
    price: 450,
    body: "Motor driver board for controlling DC gear motors on robot cars and mobile platforms. Useful with Arduino Nano and ESP32 builds."
  },
  {
    id: "GM-KIT-04",
    name: "Humidity Sensor",
    title: "Humidity Sensor · Available in The Gambia",
    price: 325,
    body: "Humidity and temperature sensing module for weather stations, greenhouse monitors, and science experiment kits."
  },
  {
    id: "GM-KIT-05",
    name: "IR Sensor",
    title: "IR Sensor · Available in The Gambia",
    price: 250,
    body: "Infrared sensor for obstacle detection, object sensing, and basic automation projects with microcontrollers."
  },
  {
    id: "GM-KIT-06",
    name: "Arduino Nano",
    title: "Arduino Nano · Available in The Gambia",
    price: 450,
    body: "Arduino Nano board for learning electronics, coding, sensors, motors, and school STEM projects. Compact and easy to use on a breadboard."
  },
  {
    id: "GM-KIT-07",
    name: "Joystick Module",
    title: "Joystick Module · Available in The Gambia",
    price: 200,
    body: "Analog joystick module for robot control, game-style inputs, pan-tilt mounts, and interactive Arduino projects."
  },
  {
    id: "GM-KIT-08",
    name: "Gas Sensor",
    title: "Gas Sensor · Available in The Gambia",
    price: 425,
    body: "Gas sensor module for air-quality demos, safety experiments, and classroom science projects with Arduino or ESP32."
  },
  {
    id: "GM-KIT-09",
    name: "Servo Motor",
    title: "Servo Motor · Available in The Gambia",
    price: 175,
    body: "Standard hobby servo motor for arms, steering, gates, camera mounts, and moving parts in DIY mechatronics kits."
  },
  {
    id: "GM-KIT-10",
    name: "Potentiometer",
    title: "Potentiometer · Available in The Gambia",
    price: 75,
    body: "Rotary potentiometer for volume-style controls, analog input practice, brightness control, and adjustable thresholds in circuits."
  },
  {
    id: "GM-KIT-11",
    name: "USB Cable for Arduino Nano",
    title: "USB Cable for Arduino Nano · Available in The Gambia",
    price: 150,
    body: "USB cable for programming and powering Arduino Nano boards. Handy for class sets and workshops."
  },
  {
    id: "GM-KIT-12",
    name: "LED Light",
    title: "LED Light · Available in The Gambia",
    price: 10,
    body: "LED light for indicators, traffic-light demos, displays, and beginner electronics."
  },
  {
    id: "GM-KIT-13",
    name: "Push Button",
    title: "Push Button · Available in The Gambia",
    price: 50,
    body: "Tactile push button for user inputs, start/stop controls, and simple interactive Arduino circuits."
  },
  {
    id: "GM-KIT-14",
    name: "Tire",
    title: "Robot Tire · Available in The Gambia",
    price: 100,
    body: "Rubber tire for small robot cars and gear-motor wheels. Use with matching gear motors for mobile STEM builds."
  },
  {
    id: "GM-KIT-15",
    name: "Gear Motor",
    title: "Gear Motor · Available in The Gambia",
    price: 125,
    body: "DC gear motor for robot cars, conveyors, and moving platforms. Pair with a motor driver and tires."
  },
  {
    id: "GM-KIT-16",
    name: "5V Buzzer",
    title: "5V Buzzer · Available in The Gambia",
    price: 75,
    body: "5V buzzer for alarms, alerts, doorbell demos, and sound feedback in microcontroller projects."
  },
  {
    id: "GM-KIT-17",
    name: "Transistor",
    title: "Transistor · Available in The Gambia",
    price: 30,
    body: "Transistor for switching loads, amplifying signals, and basic electronics lessons with Arduino and discrete circuits."
  },
  {
    id: "GM-KIT-18",
    name: "Capacitor",
    title: "Capacitor · Available in The Gambia",
    price: 50,
    body: "Capacitor for filtering, timing circuits, and power smoothing on breadboard and PCB projects."
  },
  {
    id: "GM-KIT-19",
    name: "Caster Wheel",
    title: "Caster Wheel · Available in The Gambia",
    price: 164,
    body: "Swivel caster wheel for three-wheel robot chassis and free-turning support on DIY robot cars."
  },
  {
    id: "GM-KIT-20",
    name: "Jumper Wires (10 pieces)",
    title: "Jumper Wires · 10 pieces · Available in The Gambia",
    price: 20,
    body: "Breadboard jumper wires (10 pieces) for connecting sensors, modules, and Arduino boards."
  },
  {
    id: "GM-KIT-21",
    name: "ESP32",
    title: "ESP32 Development Board · Available in The Gambia",
    price: 1200,
    body: "ESP32 board with Wi-Fi and Bluetooth for IoT projects, smart sensors, wireless control, and advanced STEM builds."
  },
  {
    id: "GM-KIT-22",
    name: "Buck Converter",
    title: "Buck Converter · Available in The Gambia",
    price: 300,
    body: "Step-down buck converter for supplying stable lower voltages to microcontrollers, sensors, and robot electronics."
  },
  {
    id: "GM-KIT-23",
    name: "Line Following Sensor",
    title: "Line Following Sensor · Available in The Gambia",
    price: 200,
    body: "Line-following sensor for robot cars that track black/white paths in competitions and classroom robotics."
  },
  {
    id: "GM-KIT-24",
    name: "Bluetooth Module",
    title: "Bluetooth Module · Available in The Gambia",
    price: 600,
    body: "Bluetooth module for wireless phone control of robots, data links, and remote Arduino projects."
  },
  {
    id: "GM-KIT-25",
    name: "Resistor",
    title: "Resistor · Available in The Gambia",
    price: 10,
    body: "Resistor for current limiting with LEDs, pull-up/pull-down inputs, and everyday circuit building."
  },
  {
    id: "GM-KIT-26",
    name: "Colour Sensor",
    title: "Colour Sensor · Available in The Gambia",
    price: 0,
    body: "Colour sensor module for sorting, line/colour detection demos, and interactive Arduino or ESP32 projects. Ask on WhatsApp for the current dalasi price."
  },
  {
    id: "GM-KIT-27",
    name: "Relay",
    title: "Relay Module · Available in The Gambia",
    price: 0,
    body: "Relay module for switching lights, fans, pumps, and higher-power loads safely from a microcontroller. Ask on WhatsApp for the current dalasi price."
  }
];

const products = kits.map((k) => ({
  id: k.id,
  name: k.name,
  title: k.title,
  price: k.price,
  priceCurrency: "GMD",
  description: desc(k.price > 0 ? `${k.body}\n\nPrice: D${k.price}.` : k.body),
  image: "",
  category: CAT
}));

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

const store = Function(
  "return " + fs.readFileSync(storePath, "utf8").replace(/^window\.STORE_DATA\s*=\s*/, "").replace(/;\s*$/, "")
)();
const ids = products.map((p) => p.id);
const prev = Array.isArray(store.gambiaIds) ? store.gambiaIds.map(String) : [];
store.gambiaIds = [...new Set([...prev.filter((id) => !id.startsWith("GM-KIT-")), ...ids])];
store.updatedAt = new Date().toISOString();
fs.writeFileSync(storePath, "window.STORE_DATA = " + JSON.stringify(store, null, 2) + ";\n", "utf8");

console.log(
  JSON.stringify(
    {
      catalogCount: next.length,
      updated: products.length,
      samples: products.slice(0, 5).map((p) => ({ id: p.id, name: p.name, price: p.price })),
      ultrasonic: products.find((p) => p.id === "GM-KIT-02"),
      led: products.find((p) => p.id === "GM-KIT-12"),
      jumpers: products.find((p) => p.id === "GM-KIT-20")
    },
    null,
    2
  )
);
