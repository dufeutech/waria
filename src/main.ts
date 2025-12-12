/**
 * WC-Aria Demo Entry Point
 */

// Import library (components are queued, not registered yet)
import { App } from "./index";

// Initialize - registers all queued components
App.start({
  hash: true,
  before: (from, to, { next }) => {
    console.log("Going from", from.path, "to", to.path);
    console.log("Query params:", to.query);
    next();
  },
  after: (_, to) => {
    console.log("Arrived at", to.path);
  },
});

// Mocking
import Mock from "./_examples.ts";

// Demo: Add some example components to the page
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
${Mock.app}
<div class="viewer">
  ${Mock.html}
</div>
`;

// Add some CSS for state indication
const style = document.createElement("style");
style.textContent = Mock.style;
document.head.appendChild(style);

console.log("WC-Aria components loaded successfully!");

// Alpine-JS
// @ts-ignore
// import Alpine from "alpinejs";
// @ts-ignore
// window.Alpine = Alpine;

// Init
// Alpine.start();
