from django.contrib import admin
from django.utils.html import format_html
from .models import Producto, Pedido, DetallePedido

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'marca', 'size', 'precio_venta', 'costo_vendedora', 'ganancia_formateada', 'stock', 'estado_disponible', 'eliminado')
    list_filter = ('marca', 'disponible', 'size', 'eliminado')
    search_fields = ('nombre', 'marca', 'color')
    list_editable = ('precio_venta', 'costo_vendedora', 'stock')

    def ganancia_formateada(self, obj):
        # Aseguramos el cálculo seguro de la ganancia unitaria si el método existe o por diferencia directa
        ganancia = (obj.precio_venta - obj.costo_vendedora) if hasattr(obj, 'precio_venta') and hasattr(obj, 'costo_vendedora') else 0
        texto_formateado = f"${ganancia:,.2f}"
        return format_html('<b style="color: green;">{}</b>', texto_formateado)
    ganancia_formateada.short_description = "Ganancia x Par"

    def estado_disponible(self, obj):
        if obj.disponible and obj.stock > 0 and not obj.eliminado:
            return format_html('<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 4px;">En Stock</span>')
        elif obj.eliminado:
            return format_html('<span style="background: #6c757d; color: white; padding: 3px 8px; border-radius: 4px;">Eliminado</span>')
        return format_html('<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 4px;">Agotado</span>')
    estado_disponible.short_description = "Estado"


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    readonly_fields = ('subtotal_venta', 'subtotal_ganancia')


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'codigo_seguimiento', 'nombre_cliente', 'telefono_cliente', 'estado', 'pagado_badge', 'fecha_pedido')
    list_filter = ('estado', 'pagado', 'fecha_pedido')
    search_fields = ('nombre_cliente', 'telefono_cliente', 'codigo_seguimiento')
    list_editable = ('estado',)
    inlines = [DetallePedidoInline]

    def pagado_badge(self, obj):
        if obj.pagado:
            return format_html('<span style="color: green; font-weight: bold;">✔ Pagado</span>')
        return format_html('<span style="color: red; font-weight: bold;">✘ Pendiente</span>')
    pagado_badge.short_description = "Pago"


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'pedido', 'nombre_producto_historico', 'cantidad', 'subtotal_venta', 'subtotal_ganancia')
    search_fields = ('nombre_producto_historico', 'pedido__nombre_cliente', 'pedido__codigo_seguimiento')