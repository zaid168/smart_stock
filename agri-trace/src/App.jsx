import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";
import {
  registerBatch,
  getBatch,
  updateBatchStatus,
  getBatchHistory
} from "./blockchain";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [showForm, setShowForm] = useState(false);
 const [search, setSearch] = useState(
  () => new URLSearchParams(window.location.search).get("batch") || ""
);
  const [trackedBatch, setTrackedBatch] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  useEffect(() => {
    const id = search.trim();

    if (!id) {
      setTrackedBatch(null);
      setTrackingHistory([]);
      setTrackingError("");
      return;
    }

    let cancelled = false;

    async function loadBlockchainBatch() {
      setTrackingLoading(true);
      setTrackingError("");

      try {
        const batch = await getBatch(id);

        if (!batch.exists) {
          throw new Error("Batch not found");
        }

        const history = await getBatchHistory(id);

        if (!cancelled) {
          setTrackedBatch({
            id: batch.batchId,
            crop: batch.cropName,
            farmer: batch.farmerName,
            quantity: `${batch.quantity.toString()} kg`,
            location: batch.origin,
            status: Number(batch.currentStatus),
          });

          setTrackingHistory(history);
        }
      } catch (error) {
        console.error("Blockchain tracking error:", error);

        if (!cancelled) {
          setTrackedBatch(null);
          setTrackingHistory([]);
          setTrackingError(
            "Batch not found on blockchain. Check the Batch ID."
          );
        }
      } finally {
        if (!cancelled) {
          setTrackingLoading(false);
        }
      }
    }

    loadBlockchainBatch();

    return () => {
      cancelled = true;
    };
  }, [search]);

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

  const [distributors] = useState([
    {
      id: "D001",
      name: "ABC Agro Logistics",
      location: "Chennai",
      manager: "Suresh",
    },
    {
      id: "D002",
      name: "Green Transport",
      location: "Coimbatore",
      manager: "Arun",
    },
  ]);

  const [retailers] = useState([
    {
      id: "R001",
      name: "Fresh Mart",
      location: "Chennai",
      manager: "Rahul",
    },
    {
      id: "R002",
      name: "Green Grocery",
      location: "Coimbatore",
      manager: "Vijay",
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

  async function handleBatchSubmit(e) {
    e.preventDefault();

    try {
      const newBatch = {
        id: `${batchForm.crop.toUpperCase()}-${String(batches.length + 1).padStart(3, "0")}`,
        crop: batchForm.crop,
        farmer: batchForm.farmer,
        quantity: `${batchForm.quantity} kg`,
        location: batchForm.location,
        status: "Registered",
      };

      // Store batch on blockchain
      const receipt = await registerBatch(
        newBatch.id,
        newBatch.crop,
        newBatch.farmer,
        Number(batchForm.quantity),
        newBatch.location
      );

      // Update React UI only after blockchain confirmation
      setBatches([...batches, newBatch]);

      console.log("Blockchain transaction:", receipt.hash);

      setBatchForm({
        crop: "",
        farmer: "",
        quantity: "",
        location: "",
      });

      setShowForm(false);
      setActivePage("Dashboard");

      alert("Batch successfully registered on blockchain!");
    } catch (error) {
      console.error("Blockchain registration failed:", error);
      alert("Registration failed. Check blockchain connection.");
    }
  }

  async function receiveBatch(batchId) {
    try {
      // Status 1 = ReceivedAtCollection
      const receipt = await updateBatchStatus(batchId, 1);

      // Update UI after blockchain confirmation
      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "Received at Collection" }
            : batch
        )
      );

      console.log("Receipt transaction:", receipt.hash);
      alert("Collection centre receipt recorded on blockchain!");
    } catch (error) {
      console.error("Receipt update failed:", error);
      alert("Could not update status. Check the batch's current blockchain status.");
    }
  }

  async function dispatchBatch(batchId) {
    try {
      // Status 2 = InTransitToDistributor
      const receipt = await updateBatchStatus(batchId, 2);

      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "In Transit to Distributor" }
            : batch
        )
      );

      console.log("Dispatch transaction:", receipt.hash);
      alert("Shipment recorded on blockchain!");
    } catch (error) {
      console.error("Dispatch failed:", error);
      alert("Dispatch failed. Check the batch status.");
    }
  }

  async function receiveAtDistributor(batchId) {
    try {
      const receipt = await updateBatchStatus(batchId, 3);

      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "Received at Distributor" }
            : batch
        )
      );

      console.log("Distributor receipt:", receipt.hash);
      alert("Distributor receipt recorded on blockchain!");
    } catch (error) {
      console.error(error);
      alert("Could not confirm distributor receipt.");
    }
  }

  async function dispatchToRetailer(batchId) {
    try {
      const receipt = await updateBatchStatus(batchId, 4);

      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "In Transit to Retailer" }
            : batch
        )
      );

      console.log("Retailer dispatch:", receipt.hash);
      alert("Retailer shipment recorded on blockchain!");
    } catch (error) {
      console.error(error);
      alert("Could not dispatch to retailer.");
    }
  }

  async function receiveAtRetailer(batchId) {
    try {
      const receipt = await updateBatchStatus(batchId, 5);

      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "Received at Retailer" }
            : batch
        )
      );

      console.log("Retailer receipt:", receipt.hash);
      alert("Retailer receipt recorded on blockchain!");
    } catch (error) {
      console.error(error);
      alert("Could not confirm retailer receipt.");
    }
  }

  async function deliverToConsumer(batchId) {
    try {
      const receipt = await updateBatchStatus(batchId, 6);

      setBatches((previousBatches) =>
        previousBatches.map((batch) =>
          batch.id === batchId
            ? { ...batch, status: "Delivered to Consumer" }
            : batch
        )
      );

      console.log("Consumer delivery:", receipt.hash);
      alert("Final delivery recorded on blockchain!");
    } catch (error) {
      console.error(error);
      alert("Could not confirm final delivery.");
    }
  }

  function confirmDelivery(batchId) {
    setBatches(
      batches.map((batch) =>
        batch.id === batchId
          ? { ...batch, status: "Delivered" }
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

        {/* DISTRIBUTOR MANAGEMENT */}

        {activePage === "Distributors" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Distributors</span>
                  <span>🚚</span>
                </div>
                <h2>{distributors.length}</h2>
                <p>Registered distributors</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Awaiting Dispatch</span>
                  <span>📦</span>
                </div>
                <h2>
                  {batches.filter(b => b.status === "Received at Collection").length}
                </h2>
                <p>Ready for transportation</p>
              </div>
            </section>

            <section className="content-card">
              <h2>Distributor Directory</h2>
              <div className="centre-grid">
                {distributors.map(distributor => (
                  <div className="centre-card" key={distributor.id}>
                    <h3>🚚 {distributor.name}</h3>
                    <p>Distributor ID: {distributor.id}</p>
                    <p>Location: {distributor.location}</p>
                    <p>Manager: {distributor.manager}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-card">
              <h2>Incoming Shipments</h2>
              <p className="card-subtitle">
                Dispatch batches received from collection centres.
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Crop</th>
                      <th>Farmer</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id}>
                        <td className="batch-id">{batch.id}</td>
                        <td>{batch.crop}</td>
                        <td>{batch.farmer}</td>
                        <td>{batch.quantity}</td>
                        <td>
                          <span className="badge">
                            {batch.status}
                          </span>
                        </td>
                        <td>
                          {batch.status === "Received at Collection" ? (
                            <button
                              className="primary-button"
                              onClick={() => dispatchBatch(batch.id)}
                            >
                              Dispatch
                            </button>
                          ) : batch.status === "In Transit to Distributor" ? (
                            <button
                              className="primary-button"
                              onClick={() => receiveAtDistributor(batch.id)}
                            >
                              Confirm Arrival
                            </button>
                          ) : batch.status === "Received at Distributor" ? (
                            <button
                              className="primary-button"
                              onClick={() => dispatchToRetailer(batch.id)}
                            >
                              Dispatch to Retailer
                            </button>
                          ) : (
                            <span>Waiting / Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* RETAILER MANAGEMENT */}

        {activePage === "Retailers" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <span>Total Retailers</span>
                  <span>🏪</span>
                </div>
                <h2>{retailers.length}</h2>
                <p>Registered retailers</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <span>Incoming Shipments</span>
                  <span>📦</span>
                </div>
                <h2>
                  {batches.filter(
                    b => b.status === "In Transit to Retailer"
                  ).length}
                </h2>
                <p>Awaiting retailer receipt</p>
              </div>
            </section>

            <section className="content-card">
              <h2>Registered Retailers</h2>
              <div className="centre-grid">
                {retailers.map(retailer => (
                  <div className="centre-card" key={retailer.id}>
                    <h3>🏪 {retailer.name}</h3>
                    <p>Retailer ID: {retailer.id}</p>
                    <p>Location: {retailer.location}</p>
                    <p>Manager: {retailer.manager}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="content-card">
              <h2>Retailer Shipments</h2>
              <p className="card-subtitle">
                Receive incoming shipments and confirm consumer delivery.
              </p>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Crop</th>
                      <th>Farmer</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id}>
                        <td className="batch-id">{batch.id}</td>
                        <td>{batch.crop}</td>
                        <td>{batch.farmer}</td>
                        <td>{batch.quantity}</td>
                        <td><span className="badge">{batch.status}</span></td>
                        <td>
                          {batch.status === "In Transit to Retailer" ? (
                            <button
                              className="primary-button"
                              onClick={() => receiveAtRetailer(batch.id)}
                            >
                              Confirm Receipt
                            </button>
                          ) : batch.status === "Received at Retailer" ? (
                            <button
                              className="primary-button"
                              onClick={() => deliverToConsumer(batch.id)}
                            >
                              Confirm Delivery
                            </button>
                          ) : (
                            <span>Waiting / Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* CONSUMER TRACKING */}

        {activePage === "Track Products" && (
          <section className="content-card">
            <h2>Track Your Agricultural Product</h2>

            <p className="card-subtitle">
              Enter your batch ID to view its complete journey.
            </p>

            <div className="tracking-search">
              <input
                className="search-input"
                placeholder="Example: RICE-005"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {search.trim() !== "" && (
              <>
                {trackingLoading && (
                  <p className="empty-message">
                    Fetching batch information from blockchain...
                  </p>
                )}

                {!trackingLoading && trackingError && (
                  <p className="empty-message">{trackingError}</p>
                )}

                {!trackingLoading && trackedBatch && (
                  <div className="tracking-result">
                    <div className="tracking-header">
                      <div>
                        <h2>{trackedBatch.crop}</h2>
                        <p>Batch ID: {trackedBatch.id}</p>
                      </div>

                      <span
                        className={`badge ${
                          [
                            "registered",
                            "received-at-collection",
                            "in-transit-to-distributor",
                            "received-at-distributor",
                            "in-transit-to-retailer",
                            "received-at-retailer",
                            "delivered-to-consumer",
                          ][trackedBatch.status]
                        }`}
                      >
                        {
                          [
                            "Registered",
                            "Received at Collection",
                            "In Transit to Distributor",
                            "Received at Distributor",
                            "In Transit to Retailer",
                            "Received at Retailer",
                            "Delivered to Consumer",
                          ][trackedBatch.status]
                        }
                      </span>
                    </div>

                    <div className="product-details">
                      <div>
                        <small>Farmer</small>
                        <strong>{trackedBatch.farmer}</strong>
                      </div>
                      <div>
                        <small>Quantity</small>
                        <strong>{trackedBatch.quantity}</strong>
                      </div>
                      <div>
                        <small>Origin</small>
                        <strong>{trackedBatch.location}</strong>
                      </div>
                    </div>

                    <div className="qr-section">
                      <div>
                        <h3>Product QR Code</h3>
                        <p>Scan to view this batch's supply chain journey.</p>
                      </div>

                      <div className="qr-container">
                        <QRCodeSVG
                          value={`${window.location.origin}/?batch=${encodeURIComponent(
                            trackedBatch.id
                          )}`}
                          size={180}
                          level="H"
                        />
                        <strong>{trackedBatch.id}</strong>
                      </div>
                    </div>

                    <h3>Supply Chain Journey</h3>

                    <div className="tracking-timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker completed">✓</div>
                        <div>
                          <strong>Farmer Registration</strong>
                          <p>
                            {trackedBatch.farmer} · {trackedBatch.location}
                          </p>
                          <small>Registered on blockchain</small>
                        </div>
                      </div>

                      {trackingHistory.map((event, index) => {
                        const statusNames = [
                          "Registered",
                          "Received at Collection Centre",
                          "In Transit to Distributor",
                          "Received at Distributor",
                          "In Transit to Retailer",
                          "Received at Retailer",
                          "Delivered to Consumer",
                        ];

                        return (
                          <div
                            className="timeline-item"
                            key={`${event.transactionHash}-${index}`}
                          >
                            <div className="timeline-marker completed">✓</div>
                            <div>
                              <strong>{statusNames[event.status]}</strong>
                              <p>
                                {new Date(
                                  event.timestamp * 1000
                                ).toLocaleString()}
                              </p>
                              <small>Confirmed on blockchain</small>
                              <p>
                                <small>
                                  Transaction: {event.transactionHash.slice(0, 12)}...
                                </small>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="verification-note">
                      This tracking history is retrieved from blockchain
                      transactions. Each recorded status update has a
                      corresponding transaction.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {![
          "Dashboard",
          "Farmers",
          "Crop Batches",
          "Collection Centres",
          "Distributors",
          "Retailers",
          "Track Products"
        ].includes(activePage) && (
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
