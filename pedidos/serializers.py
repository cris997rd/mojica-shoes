from rest_framework import serializers
from .models import Producto, ProductoImagen, Pedido, DetallePedido


class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen']


class ProductoSerializer(serializers.ModelSerializer):
    imagenes = ProductoImagenSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=100, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Producto
        fields = '__all__'

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        # Manejar tallas y colores si vienen como string JSON desde FormData
        tallas = validated_data.get('tallas', [])
        if isinstance(tallas, str):
            import json
            try:
                validated_data['tallas'] = json.loads(tallas)
            except:
                pass

        colores = validated_data.get('colores', [])
        if isinstance(colores, str):
            import json
            try:
                validated_data['colores'] = json.loads(colores)
            except:
                pass

        producto = Producto.objects.create(**validated_data)
        for image in uploaded_images:
            ProductoImagen.objects.create(producto=producto, imagen=image)
        return producto


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = DetallePedido
        fields = ['id', 'producto', 'producto_nombre', 'cantidad', 'precio_unitario', 'costo_unitario', 'subtotal_venta', 'subtotal_ganancia']
        read_only_fields = ['precio_unitario', 'costo_unitario', 'subtotal_venta', 'subtotal_ganancia']


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedido
        fields = ['id', 'codigo_seguimiento', 'nombre_cliente', 'telefono_cliente', 'direccion_entrega', 'fecha_pedido', 'estado', 'pagado', 'detalles']
        read_only_fields = ['codigo_seguimiento', 'fecha_pedido']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        pedido = Pedido.objects.create(**validated_data)

        for detalle_data in detalles_data:
            producto = detalle_data.get('producto')
            cantidad = detalle_data.get('cantidad', 1)

            if producto:
                precio_unitario = producto.precio_venta
                costo_unitario = producto.costo_vendedora
                subtotal_venta = precio_unitario * cantidad
                subtotal_ganancia = (precio_unitario - costo_unitario) * cantidad

                DetallePedido.objects.create(
                    pedido=pedido,
                    producto=producto,
                    nombre_producto_historico=producto.nombre,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    costo_unitario=costo_unitario,
                    subtotal_venta=subtotal_venta,
                    subtotal_ganancia=subtotal_ganancia
                )

                # Descontar del stock del producto
                if producto.stock >= cantidad:
                    producto.stock -= cantidad
                    producto.save()

        return pedido