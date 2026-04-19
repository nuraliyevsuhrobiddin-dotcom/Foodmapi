import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, MapPin, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_URL = import.meta.env.VITE_API_URL || '';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });

  return position.lat && position.lng ? (
    <Marker position={[position.lat, position.lng]} icon={customMarkerIcon}></Marker>
  ) : null;
}

export default function Admin() {
  const { user, token } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: '', address: '', lat: '', lng: '', image: '', rating: 1, type: '', workingHours: '09:00 - 23:00', menu: []
  });

  // Taom qo'shish funksiyalari
  const addMenuItem = () => {
    setFormData({ ...formData, menu: [...formData.menu, { name: '', price: '', image: '' }] });
  };
  
  const updateMenuItem = (index, field, value) => {
    const updatedMenu = [...formData.menu];
    updatedMenu[index][field] = value;
    setFormData({ ...formData, menu: updatedMenu });
  };

  const removeMenuItem = (index) => {
    const updatedMenu = formData.menu.filter((_, i) => i !== index);
    setFormData({ ...formData, menu: updatedMenu });
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/restaurants`);
      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRestaurants();
    }
  }, [user]);

  // Moved up

  const handleDelete = async (id) => {
    if(!window.confirm("Rostdan ham o'chirasizmi?")) return;
    try {
      await fetch(`${API_URL}/api/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRestaurants();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingFiles(true);
    let galleryUrls = [];
    let mainImageUrl = formData.image;

    // Fayllarni yuklash
    if (selectedFiles.length > 0) {
      const data = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        data.append('image', selectedFiles[i]);
      }
      try {
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls.length > 0) {
          galleryUrls = uploadData.urls;
          if (!mainImageUrl) mainImageUrl = galleryUrls[0];
        }
      } catch (err) {
        console.error("Rasm yuklashda xatolik:", err);
      }
    }

    const payload = {
      ...formData,
      image: mainImageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      category: [formData.type],
      gallery: galleryUrls
    };

    try {
      const res = await fetch(`${API_URL}/api/restaurants`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', address: '', lat: '', lng: '', image: '', rating: 1, type: '', workingHours: '09:00 - 23:00', menu: [] });
        setSelectedFiles([]);
        fetchRestaurants();
      }
    } catch (err) {
      console.error(err);
    }
    setUploadingFiles(false);
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Boshqaruv Paneli</h1>
            <p className="text-slate-500">Tizimdagi barcha retsoranlarni boshqarish</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            {showForm ? "Yopish" : <><Plus size={18} /> Yangi Qo'shish</>}
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4">Yangi restoran qo'shish</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Nomi</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Manzil</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Lat (Kenglik)</label>
                <input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Lng (Uzunlik)</label>
                <input required type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary transition-colors" />
              </div>

              {/* Xarita joyi */}
              <div className="md:col-span-2 mb-2">
                <label className="text-xs font-medium text-slate-500 mb-1 block">Xaritadan aniq joyni tanlang (Marker qo'ying)</label>
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-10">
                  <MapContainer 
                    center={formData.lat && formData.lng ? [formData.lat, formData.lng] : [38.8615, 65.7854]} 
                    zoom={13} 
                    className="w-full h-full"
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <LocationMarker 
                      position={{ lat: formData.lat, lng: formData.lng }} 
                      setPosition={(lat, lng) => setFormData({...formData, lat, lng})} 
                    />
                  </MapContainer>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Siz xaritaga bosgan nuqtangiz avtomatik tarzda "Lat" va "Lng" xonalarini to'ldiradi.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Rasm URL (Yoki fayl tanlang)</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Toifa (Milliy, Kafe...)</label>
                <input required type="text" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Ish vaqti (Masalan: 08:00 - 22:00)</label>
                <input required type="text" value={formData.workingHours} onChange={e => setFormData({...formData, workingHours: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-500">Rasmlar Galereyasi (bir nechta tanlash mumkin)</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(e.target.files)} className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary" />
              </div>

              {/* Menyu Section */}
              <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Menyu (Taomlar ro'yxati)</h3>
                  <button type="button" onClick={addMenuItem} className="text-xs font-semibold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg outline-none hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    + Taom qo'shish
                  </button>
                </div>
                
                {formData.menu.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Hozircha menyu kiritilmagan. Yuqoridagi tugmani bosib taom qo'shing.</p>
                ) : (
                  <div className="space-y-3">
                    {formData.menu.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                        <input required type="text" placeholder="Taom nomi (Masalan: Osh)" value={item.name} onChange={e => updateMenuItem(index, 'name', e.target.value)} className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary" />
                        <input required type="text" placeholder="Narxi (Masalan: 25 000)" value={item.price} onChange={e => updateMenuItem(index, 'price', e.target.value)} className="w-full sm:w-32 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary" />
                        <input type="url" placeholder="Taom rasmi (URL)" value={item.image} onChange={e => updateMenuItem(index, 'image', e.target.value)} className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary" />
                        
                        <button type="button" onClick={() => removeMenuItem(index)} className="w-full sm:w-auto mt-2 sm:mt-0 p-2 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center justify-center">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button disabled={uploadingFiles} className="md:col-span-2 mt-4 bg-primary text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                {uploadingFiles ? 'Yuklanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nomi</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Toifasi</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Reyting</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {restaurants.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{r.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin size={12}/> {r.location?.coordinates?.[1]}, {r.location?.coordinates?.[0]}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{r.category?.join(', ') || r.type}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{r.rating} ⭐</td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(r._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {restaurants.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500">Hech qanday ma'lumot yo'q</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
