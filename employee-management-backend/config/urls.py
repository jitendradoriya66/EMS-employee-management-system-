from django.contrib import admin
from django.urls import path,include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/v1/auth/",
        include("apps.authentication.api.v1.urls"),
    ),
    path(
        "api/v1/users/",
        include("apps.users.api.v1.urls"),
    ),
    path(
        "api/v1/departments/",
        include("apps.departments.api.v1.urls"),
    ),
    path(
        "api/v1/attendance/",
        include("apps.attendance.api.v1.urls"),
    ),
    path(
        "api/v1/employees/",
        include("apps.employees.api.v1.urls"),
    ),
    path(
        "api/v1/leave/",
        include("apps.leave.api.v1.urls"),
    ),
    path(
        "api/v1/payroll/",
        include("apps.payroll.api.v1.urls"),
    ),
    path(
        "api/v1/performance/",
        include("apps.performance.api.v1.urls"),
    ),
    path(
        "api/v1/projects/",
        include("apps.projects.api.v1.urls"),
    ),
    path(
        "api/v1/dashboard/",
        include("apps.dashboard.api.v1.urls"),
    ),
    path(
        "api/v1/tasks/",
        include("apps.tasks.api.v1.urls"),
    ),
    path(
        "api/v1/support/",
        include("apps.support.api.v1.urls"),
    ),
    path(
        "api/v1/roles/",
        include("apps.roles.api.v1.urls"),
    ),
    path(
        "api/v1/designations/",
        include("apps.designations.api.v1.urls"),
    ),
    path(
        "api/v1/permissions/",
        include("apps.permissions.api.v1.urls"),
    ),
    path(
        "api/v1/activity-logs/",
        include("apps.activity_logs.api.v1.urls"),
    ),
    path(
        "api/v1/audit-logs/",
        include("apps.audit_logs.api.v1.urls"),
    ),
    path(
        "api/v1/integrations/",
        include("apps.integrations.api.v1.urls"),
    ),
    path(
        "api/v1/documents/",
        include("apps.documents.api.v1.urls"),
    ),
    path(
        "api/v1/notifications/",
        include("apps.notifications.api.v1.urls"),
    ),
    path(
        "api/v1/recruitment/",
        include("apps.recruitment.api.v1.urls"),
    ),
    path(
        "api/v1/reports/",
        include("apps.reports.api.v1.urls"),
    ),
    path(
        "api/v1/settings/",
        include("apps.settings.api.v1.urls"),
    ),
    # 1. Downloads or serves the raw OpenAPI schema file (JSON)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    
    # 2. Renders the interactive Swagger UI
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # 3. Optional: Renders alternative ReDoc UI layout
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

]