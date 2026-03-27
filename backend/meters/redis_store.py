import json
import time
import redis
from django.conf import settings

# 15 minutes in seconds
TTL_SECONDS = 15 * 60

_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _zset_key(meter_name):
    return f"power:{meter_name}"


def _latest_key(meter_name):
    return f"power_latest:{meter_name}"


def store_power_reading(meter_name, timestamp_iso, reading_dict):
    """Store a power reading in Redis ZSET and latest hash.

    Args:
        meter_name: Name of the meter
        timestamp_iso: ISO format timestamp string
        reading_dict: Dict with voltage, current, active_power, etc.
    """
    r = get_redis()
    score = _iso_to_epoch(timestamp_iso)
    member = json.dumps({**reading_dict, 'timestamp': timestamp_iso})
    cutoff = time.time() - TTL_SECONDS

    pipe = r.pipeline()
    pipe.zadd(_zset_key(meter_name), {member: score})
    pipe.zremrangebyscore(_zset_key(meter_name), '-inf', cutoff)
    pipe.hset(_latest_key(meter_name), mapping={
        'data': member,
        'timestamp': timestamp_iso,
    })
    pipe.sadd('power_meters', meter_name)
    pipe.execute()


def get_latest_reading(meter_name):
    """Get the most recent reading for a meter. O(1) via hash."""
    r = get_redis()
    data = r.hget(_latest_key(meter_name), 'data')
    if data:
        return json.loads(data)
    return None


def get_readings_in_range(meter_name, start_epoch, end_epoch):
    """Get readings between two epoch timestamps from ZSET."""
    r = get_redis()
    members = r.zrangebyscore(_zset_key(meter_name), start_epoch, end_epoch)
    return [json.loads(m) for m in members]


def get_recent_readings(meter_name, minutes=15):
    """Get recent readings for a meter from the last N minutes."""
    end_epoch = time.time()
    start_epoch = end_epoch - (minutes * 60)
    return get_readings_in_range(meter_name, start_epoch, end_epoch)


def get_all_meter_names():
    """Get all meter names that have data in Redis."""
    r = get_redis()
    return r.smembers('power_meters')


def _iso_to_epoch(iso_str):
    """Convert ISO timestamp string to epoch seconds."""
    from datetime import datetime, timezone
    dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
    return dt.timestamp()
