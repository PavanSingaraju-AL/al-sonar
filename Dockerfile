# Use the official SonarQube image as the base image
FROM sonarqube:9.9.0-community

# Install wget
USER root
RUN apt-get update && apt-get install -y wget
USER sonarqube

# Create a directory to store the downloaded JAR file
RUN mkdir -p /opt/sonarqube/extensions/plugins/
RUN mkdir -p /opt/sonarqube/extensions/downloads/

# Download the sonar-cnes-report-4.2.0.jar file using wget
RUN wget -O /opt/sonarqube/extensions/plugins/sonar-cnes-report-4.2.0.jar \
    https://github.com/cnescatlab/sonar-cnes-report/releases/download/4.2.0/sonar-cnes-report-4.2.0.jar

RUN wget -O /opt/sonarqube/extensions/downloads/accionlabsLogo.png \
    https://res.cloudinary.com/accion-labs/image/upload/v1663754606/content-ms/color_3a6246326a.png

# Optional: Copy additional configuration files
# COPY sonar.properties /opt/sonarqube/conf/

# Optional: Set environment variables
ENV SONAR_WEB_PORT=9000

# Set custom logo path in SonarQube settings
ENV SONARQUBE_WEB_CUSTOMLOGOPATH=/opt/sonarqube/extensions/downloads/accionlabsLogo.png

# Expose ports (if needed)
EXPOSE 9000

# Optional: Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s CMD curl -f http://localhost:9000 || exit 1

# Optional: Add your custom setup commands
# RUN apt-get update && apt-get install -y your-package

# Optional: Add your custom entry point script
# COPY entrypoint.sh /opt/sonarqube/
