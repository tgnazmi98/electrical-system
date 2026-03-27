from django.core.management.base import BaseCommand
from django.db import connection
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Setup TimescaleDB extensions and hypertables'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            try:
                # Enable TimescaleDB extension
                self.stdout.write('Creating TimescaleDB extension...')
                cursor.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")

                # Enable other necessary extensions
                cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

                # Convert tables to hypertables (must be done after tables exist)
                try:
                    self.stdout.write('Converting power_readings to hypertable...')
                    cursor.execute("""
                        SELECT create_hypertable('power_readings', 'timestamp', if_not_exists => TRUE);
                    """)
                except Exception as e:
                    if "already a hypertable" not in str(e):
                        logger.warning(f"Could not create hypertable for power_readings: {e}")

                try:
                    self.stdout.write('Converting energy_readings to hypertable...')
                    cursor.execute("""
                        SELECT create_hypertable('energy_readings', 'timestamp', if_not_exists => TRUE);
                    """)
                except Exception as e:
                    if "already a hypertable" not in str(e):
                        logger.warning(f"Could not create hypertable for energy_readings: {e}")

                # Create continuous aggregate for 1-minute power averages
                try:
                    self.stdout.write('Creating continuous aggregate power_readings_1min...')
                    cursor.execute("""
                        CREATE MATERIALIZED VIEW IF NOT EXISTS power_readings_1min
                        WITH (timescaledb.continuous) AS
                        SELECT
                            time_bucket('1 minute', timestamp) AS bucket,
                            meter_name,
                            AVG(voltage) AS voltage,
                            AVG(current) AS current,
                            AVG(active_power) AS active_power,
                            AVG(apparent_power) AS apparent_power,
                            AVG(reactive_power) AS reactive_power,
                            AVG(power_factor) AS power_factor,
                            AVG(frequency) AS frequency,
                            COUNT(*) AS sample_count
                        FROM power_readings
                        GROUP BY bucket, meter_name
                        WITH NO DATA;
                    """)
                except Exception as e:
                    if "already exists" not in str(e):
                        logger.warning(f"Could not create continuous aggregate: {e}")

                # Add continuous aggregate refresh policy
                try:
                    self.stdout.write('Adding continuous aggregate refresh policy...')
                    cursor.execute("""
                        SELECT add_continuous_aggregate_policy('power_readings_1min',
                            start_offset => INTERVAL '10 minutes',
                            end_offset => INTERVAL '1 minute',
                            schedule_interval => INTERVAL '1 minute',
                            if_not_exists => TRUE);
                    """)
                except Exception as e:
                    logger.warning(f"Could not add continuous aggregate policy: {e}")

                # Add retention policies
                try:
                    self.stdout.write('Setting up retention policies...')
                    # Raw power_readings: keep only 30 minutes (continuous aggregate preserves averages)
                    cursor.execute("""
                        SELECT add_retention_policy('power_readings', INTERVAL '30 minutes', if_not_exists => TRUE);
                    """)
                    # Continuous aggregate: keep 3 years
                    cursor.execute("""
                        SELECT add_retention_policy('power_readings_1min', INTERVAL '3 years', if_not_exists => TRUE);
                    """)
                    cursor.execute("""
                        SELECT add_retention_policy('energy_readings', INTERVAL '3 years', if_not_exists => TRUE);
                    """)
                except Exception as e:
                    logger.warning(f"Could not add retention policies: {e}")

                # Add compression policies
                try:
                    self.stdout.write('Setting up compression policies...')
                    cursor.execute("""
                        SELECT add_compression_policy('power_readings', INTERVAL '7 days', if_not_exists => TRUE);
                    """)
                    cursor.execute("""
                        SELECT add_compression_policy('energy_readings', INTERVAL '7 days', if_not_exists => TRUE);
                    """)
                except Exception as e:
                    logger.warning(f"Could not add compression policies: {e}")

                self.stdout.write(
                    self.style.SUCCESS('Successfully setup TimescaleDB extensions and hypertables')
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error setting up TimescaleDB: {e}')
                )
                raise