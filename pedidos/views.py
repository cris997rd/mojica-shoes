from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Producto, Pedido, DetallePedido
from .serializers import ProductoSerializer, PedidoSerializer, DetallePedidoSerializer


def tienda_view(request):
    return render(request, 'pedidos/tienda.html')


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(eliminado=False)
    serializer_class = ProductoSerializer
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        producto = self.get_object()
        producto.eliminado = True
        producto.disponible = False
        producto.save()
        return Response({"mensaje": "Producto removido manteniendo historial."}, status=status.HTTP_200_OK)


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-fecha_pedido')
    serializer_class = PedidoSerializer
    pagination_class = None

    @action(detail=False, methods=['get'])
    def reportes_ganancias(self, request):
        now = timezone.now()
        inicio_semana = now - timedelta(days=7)
        inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        inicio_anio = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Totales Generales
        detalles_todos = DetallePedido.objects.all()
        pedidos_totales = Pedido.objects.count()
        ingresos_totales = detalles_todos.aggregate(t=Sum('subtotal_venta'))['t'] or 0
        ganancia_total = detalles_todos.aggregate(t=Sum('subtotal_ganancia'))['t'] or 0

        # Ganancias por Semana
        detalles_semana = DetallePedido.objects.filter(pedido__fecha_pedido__gte=inicio_semana)
        ganancia_semana = detalles_semana.aggregate(t=Sum('subtotal_ganancia'))['t'] or 0

        # Ganancias por Mes
        detalles_mes = DetallePedido.objects.filter(pedido__fecha_pedido__gte=inicio_mes)
        ganancia_mes = detalles_mes.aggregate(t=Sum('subtotal_ganancia'))['t'] or 0

        # Ganancias por Año
        detalles_anio = DetallePedido.objects.filter(pedido__fecha_pedido__gte=inicio_anio)
        ganancia_anio = detalles_anio.aggregate(t=Sum('subtotal_ganancia'))['t'] or 0

        promedio_venta = (float(ingresos_totales) / pedidos_totales) if pedidos_totales > 0 else 0.0

        return Response({
            "ingresos_totales": float(ingresos_totales),
            "ganancia_neta": float(ganancia_total),
            "ganancia_semana": float(ganancia_semana),
            "ganancia_mes": float(ganancia_mes),
            "ganancia_anio": float(ganancia_anio),
            "promedio_venta": float(promedio_venta),
            "total_pedidos": pedidos_totales
        })

    @action(detail=False, methods=['post'])
    def reiniciar_metricas(self, request):
        Pedido.objects.all().delete()
        DetallePedido.objects.all().delete()
        return Response({"mensaje": "Métricas reiniciadas a $0.00."}, status=status.HTTP_200_OK)