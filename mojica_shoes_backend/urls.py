from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from pedidos.views import ProductoViewSet, PedidoViewSet, tienda_view

router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', tienda_view, name='tienda-home'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

# Habilita la ruta pública para servir imágenes de la galería en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)