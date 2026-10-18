import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  RefreshCw, 
  MessageSquare,
  Plus,
  X,
  PackagePlus,
  Pencil,
  Trash2,
  Package,
  RotateCcw,
  BarChart2,
  Tag,
  Calendar
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const TALLAS_DISPONIBLES = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"];

export default function App() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [reporte, setReporte] = useState({ 
    ingresos_totales: 0, 
    ganancia_neta: 0, 
    ganancia_semana: 0, 
    ganancia_mes: 0, 
    ganancia_anio: 0, 
    promedio_venta: 0, 
    total_pedidos: 0 
  });
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [vistaActiva, setVistaActiva] = useState('PEDIDOS');

  // Modales
  const [mostrarModalPedido, setMostrarModalPedido] = useState(false);
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);

  // Estados Formulario Pedido
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [nuevoPedido, setNuevoPedido] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    direccion_entrega: '',
    estado: 'PENDIENTE'
  });

  // Estados Formulario Producto
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', marca: '', descripcion: '', costo_vendedora: '', precio_venta: '', stock: 10, disponible: true
  });
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [colores, setColores] = useState([]);
  const [fotoTemporal, setFotoTemporal] = useState(null);
  const [listaFotos, setListaFotos] = useState([]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      try {
        const resProductos = await axios.get(`${API_BASE_URL}/productos/`);
        setProductos(Array.isArray(resProductos.data) ? resProductos.data : (resProductos.data?.results || []));
      } catch (e) { console.error(e); }

      try {
        const resPedidos = await axios.get(`${API_BASE_URL}/pedidos/`);
        setPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : (resPedidos.data?.results || []));
      } catch (e) { console.error(e); }

      try {
        const resReporte = await axios.get(`${API_BASE_URL}/pedidos/reportes_ganancias/`);
        setReporte(resReporte.data || reporte);
      } catch (e) { console.warn(e); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleReiniciarMetricas = async () => {
    if (window.confirm("¿Estás seguro de reiniciar la caja? Se borrarán todos los pedidos y métricas.")) {
      try {
        await axios.post(`${API_BASE_URL}/pedidos/reiniciar_metricas/`, {});
        alert("¡Caja reiniciada exitosamente!");
        cargarDatos();
      } catch (error) { alert("Error al reiniciar caja."); }
    }
  };

  const handleEliminarProducto = async (id, nombre) => {
    if (window.confirm(`¿Remover "${nombre}" del catálogo? Se ocultará conservando historial.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/productos/${id}/`);
        alert("Producto removido.");
        cargarDatos();
      } catch (error) { alert("Error al eliminar."); }
    }
  };

  const handleCrearPedido = async (e) => {
    e.preventDefault();
    if (!productoIdSeleccionado) return alert("Selecciona un calzado.");
    try {
      await axios.post(`${API_BASE_URL}/pedidos/`, {
        nombre_cliente: nuevoPedido.nombre_cliente,
        telefono_cliente: nuevoPedido.telefono_cliente,
        direccion_entrega: nuevoPedido.direccion_entrega,
        estado: nuevoPedido.estado,
        detalles: [{ producto: parseInt(productoIdSeleccionado, 10), cantidad: Math.max(1, parseInt(cantidad, 10) || 1) }]
      });
      setMostrarModalPedido(false);
      cargarDatos();
    } catch (error) { alert("Error al guardar pedido."); }
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    if (tallasSeleccionadas.length === 0) return alert("Selecciona al menos una talla.");
    let fotosFinales = [...listaFotos];
    if (fotoTemporal) fotosFinales.push(fotoTemporal);

    try {
      const formData = new FormData();
      formData.append('nombre', nuevoProducto.nombre);
      formData.append('marca', nuevoProducto.marca);
      formData.append('descripcion', nuevoProducto.descripcion || '');
      formData.append('costo_vendedora', parseFloat(nuevoProducto.costo_vendedora));
      formData.append('precio_venta', parseFloat(nuevoProducto.precio_venta));
      formData.append('stock', parseInt(nuevoProducto.stock, 10));
      formData.append('disponible', nuevoProducto.disponible);
      formData.append('tallas', JSON.stringify(tallasSeleccionadas));
      formData.append('colores', JSON.stringify(colores));

      if (fotosFinales.length > 0) formData.append('imagen', fotosFinales[0]);
      fotosFinales.forEach(file => formData.append('uploaded_images', file));

      if (productoEditandoId) {
        await axios.patch(`${API_BASE_URL}/productos/${productoEditandoId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API_BASE_URL}/productos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setMostrarModalProducto(false);
      cargarDatos();
    } catch (error) { alert("Error al guardar calzado."); }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await axios.patch(`${API_BASE_URL}/pedidos/${id}/`, { estado: nuevoEstado });
      cargarDatos();
    } catch (error) { alert("Error al cambiar estado."); }
  };

  const calcularTotalPedido = (pedido) => {
    if (pedido.detalles && pedido.detalles.length > 0) {
      return pedido.detalles.reduce((acc, det) => acc + (parseFloat(det.subtotal_venta) || 0), 0);
    }
    return parseFloat(pedido.total_pedido || 0);
  };

  const abrirWhatsApp = (pedido) => {
    const total = calcularTotalPedido(pedido).toFixed(2);
    const msj = `Hola *${pedido.nombre_cliente}*, de *Mójica Shoes* 👟.\nTu código de pedido/reembolso es: *${pedido.codigo_seguimiento}*.\nMonto: *$${total}* - Estado: *${pedido.estado}*.`;
    window.open(`https://wa.me/${pedido.telefono_cliente.replace(/\D/g, '')}?text=${encodeURIComponent(msj)}`, '_blank');
  };

  const pedidosFiltrados = filtroEstado === 'TODOS' ? pedidos : pedidos.filter(p => p.estado === filtroEstado);
  const productoActual = productos.find(p => String(p.id) === String(productoIdSeleccionado));

  return (
    <div style={{ textAlign: 'left', width: '100%' }} className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ margin: 0 }}>
            MÓJICA SHOES <span className="text-pink-600 text-lg font-semibold ml-2">Panel Admin</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control de inventario, finanzas y códigos de reembolso</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => { setProductoEditandoId(null); setNuevoProducto({nombre:'',marca:'',descripcion:'',costo_vendedora:'',precio_venta:'',stock:10,disponible:true}); setTallasSeleccionadas([]); setColores([]); setListaFotos([]); setMostrarModalProducto(true); }} className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm cursor-pointer">
            <PackagePlus className="w-5 h-5" /> Nuevo Calzado
          </button>
          <button onClick={() => setMostrarModalPedido(true)} className="flex items-center gap-2 bg-pink-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-pink-700 transition shadow-sm cursor-pointer">
            <Plus className="w-5 h-5" /> Nuevo Pedido
          </button>
          <button onClick={handleReiniciarMetricas} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition cursor-pointer">
            <RotateCcw className="w-4 h-4" /> Reiniciar Caja
          </button>
          <button onClick={cargarDatos} className="flex items-center gap-2 bg-pink-50 text-pink-600 font-bold px-4 py-2 rounded-xl hover:bg-pink-100 transition cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* MÉTRICAS GENERALES Y POR PERÍODO (SEMANA, MES, AÑO) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Ingresos Totales</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">${parseFloat(reporte.ingresos_totales || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Ganancia Neta</p>
          <h3 className="text-lg font-black text-pink-600 mt-1">${parseFloat(reporte.ganancia_neta || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 bg-emerald-50/50">
          <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Ganancia Semana</p>
          <h3 className="text-lg font-black text-emerald-700 mt-1">${parseFloat(reporte.ganancia_semana || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 bg-blue-50/50">
          <p className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Ganancia Mes</p>
          <h3 className="text-lg font-black text-blue-700 mt-1">${parseFloat(reporte.ganancia_mes || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 bg-purple-50/50">
          <p className="text-xs font-bold text-purple-600 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Ganancia Año</p>
          <h3 className="text-lg font-black text-purple-700 mt-1">${parseFloat(reporte.ganancia_anio || 0).toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase">Promedio Venta</p>
          <h3 className="text-lg font-black text-gray-900 mt-1">${parseFloat(reporte.promedio_venta || 0).toFixed(2)}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 gap-2">
        <button onClick={() => setVistaActiva('PEDIDOS')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${vistaActiva === 'PEDIDOS' ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
          <ShoppingBag className="w-4 h-4" /> Histórico de Pedidos ({pedidos.length})
        </button>
        <button onClick={() => setVistaActiva('PRODUCTOS')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${vistaActiva === 'PRODUCTOS' ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Package className="w-4 h-4" /> Inventario de Calzados ({productos.length})
        </button>
      </div>

      {/* VISTA PEDIDOS CON CÓDIGO ÚNICO */}
      {vistaActiva === 'PEDIDOS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-900">Listado de Pedidos y Códigos de Reembolso</h2>
            <div className="flex gap-2">
              {['TODOS', 'PENDIENTE', 'ENTREGADO', 'REEMBOLSADO', 'CANCELADO'].map((e) => (
                <button key={e} onClick={() => setFiltroEstado(e)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filtroEstado === e ? 'bg-pink-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{e}</button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase font-bold border-b border-gray-100">
                  <th className="p-4">Código Reembolso</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Monto Venta</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones / Cambios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {pedidosFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-400">No hay pedidos registrados.</td></tr>
                ) : (
                  pedidosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-pink-600 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-pink-500" /> {p.codigo_seguimiento}
                      </td>
                      <td className="p-4 font-medium text-gray-800"><div>{p.nombre_cliente}</div><span className="text-xs text-gray-400">{p.direccion_entrega || 'Sin dirección'}</span></td>
                      <td className="p-4 text-gray-600">{p.telefono_cliente}</td>
                      <td className="p-4 font-bold text-gray-900">${calcularTotalPedido(p).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.estado === 'ENTREGADO' ? 'bg-green-100 text-green-700' : p.estado === 'REEMBOLSADO' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        {p.estado === 'PENDIENTE' && <button onClick={() => cambiarEstado(p.id, 'ENTREGADO')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Entregar</button>}
                        <button onClick={() => cambiarEstado(p.id, 'REEMBOLSADO')} className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200" title="Marcar como Reembolsado/Cambiado">Reembolso</button>
                        <button onClick={() => abrirWhatsApp(p)} className="bg-emerald-50 text-emerald-600 p-2 rounded-lg" title="Enviar WhatsApp con código"><MessageSquare className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA PRODUCTOS */}
      {vistaActiva === 'PRODUCTOS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Catálogo de Calzados Registrados</h2>
            <button onClick={() => { setProductoEditandoId(null); setNuevoProducto({nombre:'',marca:'',descripcion:'',costo_vendedora:'',precio_venta:'',stock:10,disponible:true}); setTallasSeleccionadas([]); setColores([]); setListaFotos([]); setMostrarModalProducto(true); }} className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"><Plus className="w-4 h-4" /> Agregar Calzado</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase font-bold border-b border-gray-100">
                  <th className="p-4">Foto</th>
                  <th className="p-4">Calzado</th>
                  <th className="p-4">Marca</th>
                  <th className="p-4">Precios</th>
                  <th className="p-4">Tallas</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="p-4"><img src={(prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0].imagen : (prod.imagen || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100')} alt={prod.nombre} className="w-12 h-12 object-cover rounded-xl border" /></td>
                    <td className="p-4 font-bold text-gray-900"><div>{prod.nombre}</div><span className="text-xs text-gray-400 font-normal">{prod.descripcion || 'Sin descripción'}</span></td>
                    <td className="p-4 text-gray-600 font-semibold">{prod.marca || '-'}</td>
                    <td className="p-4 font-bold"><span className="text-gray-500 text-xs block">Costo: ${prod.costo_vendedora}</span><span className="text-emerald-600">${prod.precio_venta}</span></td>
                    <td className="p-4 text-xs font-bold text-pink-600">{Array.isArray(prod.tallas) ? prod.tallas.join(', ') : (prod.size || 'N/A')}</td>
                    <td className="p-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">{prod.stock} disponibles</span></td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => {
                        setProductoEditandoId(prod.id);
                        setNuevoProducto({
                          nombre: prod.nombre, marca: prod.marca, descripcion: prod.descripcion || '',
                          costo_vendedora: prod.costo_vendedora, precio_venta: prod.precio_venta, stock: prod.stock, disponible: prod.disponible
                        });
                        setTallasSeleccionadas(Array.isArray(prod.tallas) ? prod.tallas : []);
                        setColores(Array.isArray(prod.colores) ? prod.colores : []);
                        setMostrarModalProducto(true);
                      }} className="bg-blue-50 text-blue-600 p-2 rounded-lg" title="Editar"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleEliminarProducto(prod.id, prod.nombre)} className="bg-red-50 text-red-600 p-2 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PEDIDO */}
      {mostrarModalPedido && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative my-8">
            <button onClick={() => setMostrarModalPedido(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Registrar Nuevo Pedido</h3>
            <form onSubmit={handleCrearPedido} className="space-y-4">
              <input type="text" required placeholder="Nombre del Cliente" value={nuevoPedido.nombre_cliente} onChange={e => setNuevoPedido({...nuevoPedido, nombre_cliente: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
              <input type="text" required placeholder="Teléfono / WhatsApp" value={nuevoPedido.telefono_cliente} onChange={e => setNuevoPedido({...nuevoPedido, telefono_cliente: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
              <input type="text" placeholder="Dirección de Entrega" value={nuevoPedido.direccion_entrega} onChange={e => setNuevoPedido({...nuevoPedido, direccion_entrega: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
              <select required value={productoIdSeleccionado} onChange={e => setProductoIdSeleccionado(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                <option value="">-- Selecciona un calzado --</option>
                {productos.map(p => <option key={p.id} value={String(p.id)}>{p.nombre} ({p.marca}) - ${p.precio_venta}</option>)}
              </select>
              {productoActual && <input type="number" min="1" required value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full border p-2 rounded-lg text-sm" />}
              <div className="flex justify-end gap-2 pt-4"><button type="submit" className="px-5 py-2.5 bg-pink-600 text-white text-xs font-bold rounded-xl">Guardar Pedido</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO / EDITAR PRODUCTO */}
      {mostrarModalProducto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setMostrarModalProducto(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{productoEditandoId ? '✏️ Editar Calzado' : '➕ Agregar Nuevo Calzado'}</h3>
            <form onSubmit={handleGuardarProducto} className="space-y-4">
              <input type="text" required placeholder="Nombre del Calzado" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
              <textarea rows="2" placeholder="Descripción" value={nuevoProducto.descripcion} onChange={e => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm resize-none"></textarea>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" required placeholder="Marca" value={nuevoProducto.marca} onChange={e => setNuevoProducto({...nuevoProducto, marca: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
                <input type="number" min="0" required value={nuevoProducto.stock} onChange={e => setNuevoProducto({...nuevoProducto, stock: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" required placeholder="Costo Vendedora ($)" value={nuevoProducto.costo_vendedora} onChange={e => setNuevoProducto({...nuevoProducto, costo_vendedora: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
                <input type="number" step="0.01" required placeholder="Precio Venta ($)" value={nuevoProducto.precio_venta} onChange={e => setNuevoProducto({...nuevoProducto, precio_venta: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tallas Disponibles:</label>
                <div className="flex flex-wrap gap-2">
                  {TALLAS_DISPONIBLES.map(t => (
                    <button key={t} type="button" onClick={() => {
                      if (tallasSeleccionadas.includes(t)) setTallasSeleccionadas(tallasSeleccionadas.filter(item => item !== t));
                      else setTallasSeleccionadas([...tallasSeleccionadas, t]);
                    }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${tallasSeleccionadas.includes(t) ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-700'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Colores Disponibles:</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ej: Blanco" value={colorInput} onChange={e => setColorInput(e.target.value)} className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                  <button type="button" onClick={() => { if (colorInput.trim() && !colores.includes(colorInput.trim())) { setColores([...colores, colorInput.trim()]); setColorInput(''); }}} className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold">Agregar</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colores.map(c => <span key={c} className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">{c}</span>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Foto Principal:</label>
                <input type="file" accept="image/*" onChange={e => setFotoTemporal(e.target.files[0])} className="w-full border rounded-xl p-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">{productoEditandoId ? 'Actualizar Calzado' : 'Guardar Calzado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}