export const diveFormSchema = [
  { name: "diveTitle", label: "Dive Title", type: "text", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "location", label: "Location", type: "text", required: true },
  { name: "diveSite", label: "Dive Site", type: "text" },
  
  { name: "depthMeters", label: "Depth (m)", type: "number", required: true },
  { name: "durationMinutes", label: "Duration (min)", type: "number", required: true },
  { name: "waterTemperatureCelsius", label: "Water Temp (°C)", type: "number" },
  { name: "visibilityMeters", label: "Visibility (m)", type: "number" },
  
  { 
    name: "diveType", 
    label: "Dive Environment", 
    type: "select", 
    options: ["BOAT", "SHORE", "OTHER"] 
  },
  
  { name: "waterType", label: "Water Type", type: "select", options: ["SALT", "FRESH"] },
  
  { 
    name: "gas", 
    label: "Gas Mixture", 
    type: "select", 
    options: ["AIR", "EANX32", "EANX36", "EANX40", "ENRICHED", "TRIMIX", "REBREATHER"] 
  },
  
  { name: "weather", label: "Weather", type: "text" },
  { name: "suit", label: "Suit", type: "text" },
  { name: "weightKg", label: "Weight (kg)", type: "number" },
  { name: "pressureStartBar", label: "Start Pressure (Bar)", type: "number" },
  { name: "pressureEndBar", label: "End Pressure (Bar)", type: "number" },
  { name: "buddy", label: "Buddy", type: "text" },
  { name: "diveCenter", label: "Dive Center", type: "text" },
  { name: "notes", label: "Notes", type: "textarea" },

  {
  name: "cylinderVolumeLiters",
  label: "Cylinder Volume (L)",
  type: "number",
  },

  { name: "equipmentIds", label: "Equipment Used", type: "multiselect" }
];