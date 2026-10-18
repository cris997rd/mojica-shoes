import uuid
from django.db import models


class Producto(models.Model):
    nombre = models.CharField(max_length=255, verbose_name="Nombre del Calzado")
    marca = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    costo_vendedora = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Costo Vendedora ($)")
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Precio de Venta ($)")
    
    size = models.CharField(max_length=50, blank=True, null=True, verbose_name="Talla / Size Principal")
    color = models.CharField(max_length=100, blank=True, null=True, verbose_name="Color Principal")
    
    tallas = models.JSONField(default=list, blank=True, verbose_name="Tallas Disponibles")
    colores = models.JSONField(default=list, blank=True, verbose_name="Colores Disponibles")
    
    stock = models.PositiveIntegerField(default=1, verbose_name="Cantidad Disponible")
    
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True, verbose_name="Foto Principal desde Galería")
    imagen_url = models.URLField(max_length=2000, blank=True, null=True, verbose_name="Link de la Foto (Alternativo)")
    
    disponible = models.BooleanField(default=True, verbose_name="Disponible en Catálogo")
    eliminado = models.BooleanField(default=False, verbose_name="Eliminado del Catálogo (Borrado Lógico)")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self):
        return f"{self.nombre} {self.marca}"


class ProductoImagen(models.Model):
    producto = models.ForeignKey(Producto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='productos/galeria/', verbose_name="Foto Adicional")

    def __str__(self):
        return f"Foto de {self.producto.nombre}"


class Pedido(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente de Confirmación'),
        ('RECIBIDO', 'Recibido del Suplidor'),
        ('ENTREGADO', 'Entregado al Cliente'),
        ('CANCELADO', 'Cancelado'),
        ('REEMBOLSADO', 'Reembolsado / Cambiado'),
    ]

    # Código único y seguro para cambios o reembolsos
    codigo_seguimiento = models.CharField(max_length=20, unique=True, blank=True, verbose_name="Código Único Reembolso")
    
    nombre_cliente = models.CharField(max_length=150, verbose_name="Nombre del Cliente")
    telefono_cliente = models.CharField(max_length=20, verbose_name="Teléfono / WhatsApp")
    direccion_entrega = models.TextField(blank=True, null=True, verbose_name="Dirección o Punto de Entrega")
    
    fecha_pedido = models.DateTimeField(auto_now_add=True, verbose_name="Fecha del Pedido")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    pagado = models.BooleanField(default=False, verbose_name="¿Está Pagado?")

    def save(self, *args, **kwargs):
        if not self.codigo_seguimiento:
            # Genera un código único automático en Mayúsculas (Ej: MJC-8F32)
            self.codigo_seguimiento = f"MJC-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def __str__(self):
        return f"Pedido #{self.id} [{self.codigo_seguimiento}] - {self.nombre_cliente}"


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='detalles', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True, blank=True)
    nombre_producto_historico = models.CharField(max_length=255, blank=True, null=True)
    cantidad = models.PositiveIntegerField(default=1)
    
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    costo_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal_ganancia = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        if self.producto and not self.nombre_producto_historico:
            self.nombre_producto_historico = self.producto.nombre
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Detalle #{self.id} - {self.nombre_producto_historico or 'Producto'}"