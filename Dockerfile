# ==========================================
# GIAI ĐOẠN 1: SDK Build & Unit Test
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Sao chép solution và các file .csproj để tận dụng Docker layer cache
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.slnx", "back-end/VolunteerManagerment/"]
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.Domain/VolunteerManagerment.Domain.csproj", "back-end/VolunteerManagerment/VolunteerManagerment.Domain/"]
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.Application/VolunteerManagerment.Application.csproj", "back-end/VolunteerManagerment/VolunteerManagerment.Application/"]
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.Infrastructure/VolunteerManagerment.Infrastructure.csproj", "back-end/VolunteerManagerment/VolunteerManagerment.Infrastructure/"]
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.API/VolunteerManagerment.API.csproj", "back-end/VolunteerManagerment/VolunteerManagerment.API/"]
COPY ["back-end/VolunteerManagerment/VolunteerManagerment.Tests/VolunteerManagerment.Tests.csproj", "back-end/VolunteerManagerment/VolunteerManagerment.Tests/"]

# Restore toàn bộ dependencies
RUN dotnet restore "back-end/VolunteerManagerment/VolunteerManagerment.slnx"

# Sao chép toàn bộ mã nguồn Backend
COPY back-end/VolunteerManagerment/ back-end/VolunteerManagerment/

# Chạy tự động Unit & Integration Tests để đảm bảo chất lượng
WORKDIR "/src/back-end/VolunteerManagerment/VolunteerManagerment.Tests"
RUN dotnet test --configuration Release --no-restore

# Biên dịch ứng dụng sang thư mục /app/publish
WORKDIR "/src/back-end/VolunteerManagerment/VolunteerManagerment.API"
RUN dotnet publish "VolunteerManagerment.API.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ==========================================
# GIAI ĐOẠN 2: ASP.NET Core 10.0 Runtime
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Thiết lập cổng chuẩn của ASP.NET Core Container
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Copy mã nguồn đã build từ giai đoạn 1
COPY --from=build /app/publish .

# Khởi chạy Web API
ENTRYPOINT ["dotnet", "VolunteerManagerment.API.dll"]
