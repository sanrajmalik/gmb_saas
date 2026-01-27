# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GmbSaas.Backend.csproj", "./"]
RUN dotnet restore "./GmbSaas.Backend.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "GmbSaas.Backend.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "GmbSaas.Backend.csproj" -c Release -o /app/publish

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GmbSaas.Backend.dll"]
