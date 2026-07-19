from django.contrib import admin
from django.apps import apps

class ListAdminMixin:
    def __init__(self, model, admin_site):
        self.list_display = [field.name for field in model._meta.fields]
        super().__init__(model, admin_site)

# Dynamically register all models from all apps in the admin panel
# This ensures every table is accessible without manual registration
models = apps.get_models()
for model in models:
    try:
        # Create a dynamic ModelAdmin class to display all fields in the list view
        class DynamicModelAdmin(ListAdminMixin, admin.ModelAdmin):
            pass
        
        admin.site.register(model, DynamicModelAdmin)
    except admin.sites.AlreadyRegistered:
        pass
