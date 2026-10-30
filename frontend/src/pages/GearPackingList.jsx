import { useState, useEffect } from 'react'
import { CheckSquare, Square, Package, AlertTriangle } from 'lucide-react'
import './GearPackingList.css'

const GEAR_CATEGORIES = {
  BOAT: {
    required: ['BCD', 'Regulator Set', 'Mask', 'Fins', 'Exposure Suit', 'Weights', 'Dive Computer'],
    optional: ['SMB (Surface Marker Buoy)', 'Whistle', 'DSMB', 'Spare Mask', 'Gloves', 'Boots', 'Camera', 'Dive Light']
  },
  SHORE: {
    required: ['BCD', 'Regulator Set', 'Mask', 'Fins', 'Exposure Suit', 'Weights', 'Boots', 'Dive Computer'],
    optional: ['SMB', 'Compass', 'Water Bottle', 'Snacks', 'Sunscreen', 'Rash Guard', 'Aqua Socks']
  },
  NIGHT: {
    required: ['BCD', 'Regulator Set', 'Mask', 'Fins', 'Exposure Suit', 'Primary Light', 'Backup Light', 'Dive Computer', 'Tank Light'],
    optional: ['Glow Sticks', 'Cyclops Light', 'Chemical Light Sticks', 'Spare Batteries']
  },
  DEEP: {
    required: ['BCD', 'Regulator Set', 'Mask', 'Fins', 'Exposure Suit', 'Weights', 'Dive Computer', 'Backup Computer'],
    optional: ['Pony Bottle', 'Stage Light', 'Spare Mask', 'Cutting Device', 'SMB']
  },
  TECH: {
    required: ['Double Tanks', 'Tech BCD (Backplate/Wing)', 'Primary Regulator', 'Backup Regulator', 'Canister Light', 'Cutting Device', 'Dive Computer x2'],
    optional: ['SMB w/ Spool', 'Wetnotes', 'Slate', 'Spare Spool', 'Lift Bag']
  }
}

export default function GearPackingList({ diveType, onClose }) {
  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem(`packing_list_${diveType}`)
    return saved ? JSON.parse(saved) : {}
  })

  const gearList = GEAR_CATEGORIES[diveType] || GEAR_CATEGORIES.BOAT
  const allItems = [...gearList.required.map(i => ({ name: i, required: true })), ...gearList.optional.map(i => ({ name: i, required: false }))]
  
  const toggleItem = (itemName) => {
    setCheckedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }))
  }

  const toggleAllRequired = () => {
    const allRequiredChecked = gearList.required.every(item => checkedItems[item])
    const newState = { ...checkedItems }
    gearList.required.forEach(item => {
      newState[item] = !allRequiredChecked
    })
    setCheckedItems(newState)
  }

  useEffect(() => {
    localStorage.setItem(`packing_list_${diveType}`, JSON.stringify(checkedItems))
  }, [checkedItems, diveType])

  const requiredChecked = gearList.required.filter(item => checkedItems[item]).length
  const requiredTotal = gearList.required.length
  const totalItems = allItems.length
  const totalChecked = Object.values(checkedItems).filter(Boolean).length
  const progress = totalItems ? (totalChecked / totalItems) * 100 : 0
  const allRequiredChecked = requiredChecked === requiredTotal

  return (
    <div className="packing-modal-overlay" onClick={onClose}>
      <div className="packing-modal" onClick={e => e.stopPropagation()}>
        <div className="packing-header">
          <Package size={24} />
          <h3>🎒 Packing List - {diveType} Dive</h3>
          <button onClick={onClose} className="packing-close">×</button>
        </div>

        <div className="packing-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%`, background: allRequiredChecked ? '#22c55e' : 'var(--accent)' }} />
          </div>
          <div className="progress-stats">
            <span>{Math.round(progress)}% Complete</span>
            <span>{requiredChecked}/{requiredTotal} Required</span>
          </div>
        </div>

        {!allRequiredChecked && (
          <div className="packing-warning">
            <AlertTriangle size={14} />
            <span>Missing required gear for this dive type!</span>
            <button onClick={toggleAllRequired} className="packing-fix-btn">Check All Required</button>
          </div>
        )}

        <div className="packing-section">
          <h4>✅ Required Gear</h4>
          {gearList.required.map(item => (
            <div key={item} className={`packing-item ${checkedItems[item] ? 'checked' : ''}`} onClick={() => toggleItem(item)}>
              {checkedItems[item] ? <CheckSquare size={18} color="#22c55e" /> : <Square size={18} />}
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="packing-section">
          <h4>🛠️ Optional Gear</h4>
          {gearList.optional.map(item => (
            <div key={item} className="packing-item" onClick={() => toggleItem(item)}>
              {checkedItems[item] ? <CheckSquare size={18} color="var(--accent)" /> : <Square size={18} />}
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}