import { useState } from "react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [farmers, setFarmers] = useState([
    {
      id: "F001",
      name: "Ravi Kumar",
      phone: "9876543210",
      location: "Thanjavur",
      farmSize: "5",
      crop: "Rice",
    },
    {
      id: "F002",
      name: "Arun Kumar",
      phone: "9876543211",
      location: "Coimbatore",
      farmSize: "3",
      crop: "Wheat",
    },
  ]);

  const [batches, setBatches] = useState([
    { id: "RICE-001", crop: "Rice", farmer: "Ravi Kumar", quantity: "500 kg", location: "Thanjavur", status: "Delivered" },
    { id: "WHEAT-002", crop: "Wheat", farmer: "Arun Kumar", quantity: "300 kg", location: "Coimbatore", status: "In Transit" },
    { id: "CORN-003", crop: "Corn", farmer: "Suresh", quantity: "450 kg", location: "Salem", status: "Registered" },
    { id: "RICE-004", crop: "Rice", farmer: "Manoj", quantity: "600 kg", location: "Madurai", status: "In Transit" },
  ]);

  const [centres] = useState([
    {
      id: "CC001",
      name: "Thanjavur Collection Centre",
      location: "Thanjavur",
      manager: "Ramesh",
    },
    {
      id: "CC002",
      name: "Coimbatore Collection Centre",
      location: "Coimbatore",
      manager: "Karthik",
    },
  ]);

  const [farmerForm, setFarmerForm] = useState({
    name: "",
    phone: "",
    location: "",
    farmSize: "",
    crop: "",
  });

  const [batchForm, setBatchForm] = useState({
    crop: "",
    farmer: "",
    quantity: "",
    location: "",
  });

  const menuItems = [
    "Dashboard",
    "Farmers",
    "Crop Batches",
    "Collection Centres",
    "Distributors",
    "Retailers",
    "Track Products",
  ];

  function handleFarmerSubmit(e) {
    e.preventDefault();

    const newFarmer = {
      id: `F${String(farmers.length + 1).padStart(3, "0")}`,
      ...farmerForm,
    };

    setFarmers([...farmers, newFarmer]);

    setFarmerForm({
      name: "",
      phone: "",
      location: "",
      farmSize: "",
      crop: "",
    });

    setShowForm(false);
  }

  function handleBatchSubmit(e) {
    e.preventDefault();

    const newBatch = {
      id: `${batchForm.crop.toUpperCase()}-${String(batches.length + 1).padStart(3, "0")}`,
      crop: batchForm.crop,
      farmer: batchForm.farmer,
      quantity: `${batchForm.quantity} kg`,
      location: batchForm.location,
      status: "Registered",
    };

    setBatches([...batches, newBatch]);

    setBatchForm({
      crop: "",
      farmer: "",
      quantity: "",
      location: "",
    });

    setShowForm(false);
    setActivePage("Dashboard");
  }

  function receiveBatch(batchId) {
    setBatches(
      batches.map((batch) =>
        batch.id === batchId
          ? { ...batch, status: "Received" }
          : batch
      )
    );
  }

  function navigate(page) {
    setActivePage(page);
    setShowForm(false);
    setSearch("");
  }

  const stats = [
    { title: "Total Farmers", value: farmers.length, icon: "♙", change: "Registered farmers" },
    { title: "Crop Batches", value: batches.length, icon: "🌾", change: "Registered batches" },
    { title: "In Transit", value: batches.filter(b => b.status === "In Transit").length, icon: "🚚", change: "Active shipments" },
    { title: "Delivered", value: batches.filter(b => b.status === "Delivered").length, icon: "✓", change: "Successfully delivered" },
  ];

  const filteredFarmers = farmers.filter((farmer) =>
    `${farmer.name} ${farmer.id} ${farmer.location}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app-container">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🌱</div>
          <div>
            <h2>AgriTrace</h2>
            <span>Supply Chain Tracking</span>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${activePage === item ? "active" : ""}`}
              onClick={() => navigate(item)}
            >
              <span>{getIcon(item)}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="blockchain-status">
            <span className="status-dot"></span>
            Blockchain Connected
          </div>

          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin User</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h1>{showForm ? `Register ${activePage === "Farmers" ? "Farmer" : "Crop Batch"}` : activePage}</h1>
            <p>AgriTrace Supply Chain Management</p>
          </div>
        </header>

        {/* DASHBOARD */}

        {activePage === "Dashboard" && (
          <>
            <section className="stats-grid">
              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>
                  <div className="stat-top">
                    <span>{stat.title}</span>
                    <span className="stat-icon">{stat.icon}</span>
                  </div>
                  <h2>{stat.value}</h2>
                  <p>{stat.change}</p>
                </div>
              ))}
            </section>

            <section className="content-card">
              <div className="section-header">
                <div>
                  <h2>Recent Crop Batches</h2>
                  <p>Latest registered batches</p>
                </div>
                <button className="primary-button" onClick={() => {
                  setActivePage("Crop Batches");
                  setShowForm(true);
                }}>
                  + Add New Batch
                </button>
              </div>

              <BatchTable batches={batches} />
            </section>
          </>
        )}

        {/* FARMERS PAGE */}

        {activePage === "Farmers" && !showForm && (
          <section className="content-card">

            <div className="section-header">
              <div>
                <h2>Registered Farmers</h2>
                <p>Total farmers: {farmers.length}</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                + Add Farmer
              </button>
            </div>

            <input
              className="search-input"
              placeholder="Search by name, ID or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Farmer ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Farm Size</th>
                    <th>Primary Crop</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id}>
                      <td className="batch-id">{farmer.id}</td>
                      <td>{farmer.name}</td>
                      <td>{farmer.phone}</td>
                      <td>{farmer.location}</td>
                      <td>{farmer.farmSize} acres</td>
                      <td>{farmer.crop}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredFarmers.length === 0 && (
                <p className="empty-message">No farmers found.</p>
              )}
            </div>
          </section>
        )}

        {/* FARMER REGISTRATION FORM */}

        {activePage === "Farmers" && showForm && (
          <section className="content-card form-card">
            <h2>New Farmer Details</h2>
            <p className="card-subtitle">Register a farmer in AgriTrace.</p>

            <form onSubmit={handleFarmerSubmit}>
              <label>Farmer Name</label>
              <input
                required
                value={farmerForm.name}
                onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                placeholder="Enter farmer name"
              />

              <label>Phone Number</label>
              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                value={farmerForm.phone}
                onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                placeholder="10-digit mobile number"
              />

              <label>Farm Location</label>
              <input
                required
                value={farmerForm.location}
                onChange={(e) => setFarmerForm({ ...farmerForm, location: e.target.value })}
                placeholder="Enter location"
              />

              <label>Farm Size (acres)</label>
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={farmerForm.farmSize}
                onChange={(e) => setFarmerForm({ ...farmerForm, farmSize: e.target.value })}
                placeholder="Enter farm size"
              />

              <label>Primary Crop</label>
              <select
                required
                value={farmerForm.crop}
                onChange={(e) => setFarmerForm({ ...farmerForm, crop: e.target.value })}
              >
                <option value="">Select crop</option>
                <option>Rice</option>
                <option>Wheat</option>
                <option>Corn</option>
                <option>Cotton</option>
                <option>Sugarcane</option>
              </select>

              <div className="form-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Register Farmer
                </button>
              </div>
            </form>
          </section>
        )}

        {/* CROP BATCHES PAGE */}

        {activePage === "Crop Batches" && !showForm && (
          <section className="content-card">
            <div className="section-header">
              <div>
                <h2>All Crop Batches</h2>
                <p>Total batches: {batches.length}</p>
              </div>
              <button className="primary-button" onClick={() => setShowForm(true)}>
                + Add New Batch
              </button>
            </div>
            <BatchTable batches={batches} />
          </section>
        )}

        {activePage === "Crop Batches" && showForm && (
          <section className="content-card form-card">
            <h2>New Crop Batch</h2>

            <form onSubmit={handleBatchSubmit}>
              <label>Crop Name</label>
              <select required value={batchForm.crop} onChange={(e) => setBatchForm({ ...batchForm, crop: e.target.value })}>
                <option value="">Select crop</option>
                <option>Rice</option>
                <option>Wheat</option>
                <option>Corn</option>
                <option>Cotton</option>
                <option>Sugarcane</option>
              </select>

              <label>Farmer</label>
              <select required value={batchForm.farmer} onChange={(e) => setBatchForm({ ...batchForm, farmer: e.target.value })}>
                <option value="">Select farmer</option>
                {farmers.map(farmer => (
                  <option key={farmer.id}>{farmer.name}</option>
                ))}
              </select>

              <label>Quantity (kg)</label>
              <input required type="number" min="1" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} placeholder="Enter quantity" />

              <label>Farm Location</label>
              <input required value={batchForm.location} onChange={(e) => setBatchForm({ ...batchForm, location: e.target.value })} placeholder="Enter location" />

              <div className="form-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="primary-button">Register Batch</button>
              </div>
            </form>
          </section>
        )}

        {/* COLLECTION CENTRES */}
        {activePage === "Collection Centres" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top"><span>Total Centres</span><span>🏢</span></div>
                <h2>{centres.length}</h2>
                <p>Registered collection centres</p>
              </div>
              <div className="stat-card">
                <div className="stat-top"><span>Pending Batches</span><span>📦</span></div>
                <h2>{batches.filter(b => b.status === "Registered").length}</h2>
                <p>Awaiting collection</p>
              </div>
              <div className="stat-card">
                <div className="stat-top"><span>Received Batches</span><span>✓</span></div>
                <h2>{batches.filter(b => b.status === "Received").length}</h2>
                <p>Successfully received</p>
              </div>
            </section>
            <section className="content-card">
              <h2>Registered Collection Centres</h2>
              <div className="centre-grid">
                {centres.map(centre => (
                  <div className="centre-card" key={centre.id}>
                    <h3>🏢 {centre.name}</h3>
                    <p>Centre ID: {centre.id}</p>
                    <p>Location: {centre.location}</p>
                    <p>Manager: {centre.manager}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="content-card">
              <h2>Incoming Crop Batches</h2>
              <p className="card-subtitle">Confirm receipt of registered batches.</p>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Batch ID</th><th>Crop</th><th>Farmer</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id}>
                        <td className="batch-id">{batch.id}</td>
                        <td>{batch.crop}</td>
                        <td>{batch.farmer}</td>
                        <td>{batch.quantity}</td>
                        <td><span className={`badge ${batch.status.toLowerCase().replace(" ", "-")}`}>{batch.status}</span></td>
                        <td>{batch.status === "Registered" ? (
                          <button className="primary-button" onClick={() => receiveBatch(batch.id)}>Confirm Receipt</button>
                        ) : <span>Completed</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {!["Dashboard", "Farmers", "Crop Batches", "Collection Centres"].includes(activePage) && (
          <section className="content-card placeholder">
            <h2>{activePage}</h2>
            <p>This module will be implemented next.</p>
          </section>
        )}

      </main>
    </div>
  );
}

function BatchTable({ batches }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Batch ID</th>
            <th>Crop</th>
            <th>Farmer</th>
            <th>Quantity</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.id}>
              <td className="batch-id">{batch.id}</td>
              <td>{batch.crop}</td>
              <td>{batch.farmer}</td>
              <td>{batch.quantity}</td>
              <td>{batch.location}</td>
              <td>
                <span className={`badge ${batch.status.toLowerCase().replace(" ", "-")}`}>
                  {batch.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getIcon(item) {
  const icons = {
    Dashboard: "▦",
    Farmers: "♙",
    "Crop Batches": "🌾",
    "Collection Centres": "🏢",
    Distributors: "🚚",
    Retailers: "🏪",
    "Track Products": "⌕",
  };

  return icons[item];
}

export default App;
