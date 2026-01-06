"""Project constants and default settings."""

CORE_FEATURES = {
    "time": "frame.time",
    "label": "label",
    "protocol": "protocol",
    "src_ip": "ip.src",
    "dst_ip": "ip.dst",
    "tcp_src_port": "tcp.srcport",
    "tcp_dst_port": "tcp.dstport",
    "udp_src_port": "udp.srcport",
    "udp_dst_port": "udp.dstport",
    "frame_len": "frame.len",
    "tcp_flags": "tcp.flags",
    "flow_duration": "flow.duration",
    "flow_packets": "flow.packets",
    "flow_bytes": "flow.bytes",
}

MAPPING_FEATURES = {
    "time": CORE_FEATURES["time"],
    "label": CORE_FEATURES["label"],
    "protocol": CORE_FEATURES["protocol"],
    "src_ip": CORE_FEATURES["src_ip"],
    "dst_ip": CORE_FEATURES["dst_ip"],
    "tcp_src_port": CORE_FEATURES["tcp_src_port"],
    "tcp_dst_port": CORE_FEATURES["tcp_dst_port"],
    "udp_src_port": CORE_FEATURES["udp_src_port"],
    "udp_dst_port": CORE_FEATURES["udp_dst_port"],
    "frame_len": CORE_FEATURES["frame_len"],
    "tcp_flags": CORE_FEATURES["tcp_flags"],
}

FRAME_LEN_BINS = [0, 64, 128, 256, 512, 1024, 1500, 9000]
PORT_BINS = [0, 1024, 49152, 65536]

DEFAULT_TIME_UNITS = "s"

LABEL_ALIASES = {
    "benign": 0,
    "normal": 0,
    "attack": 1,
    "malicious": 1,
    "anomaly": 1,
}
