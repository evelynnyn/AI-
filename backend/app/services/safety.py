"""Self-harm detection and Taiwan helplines (SEC-01)."""

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Helpline:
    name: str
    number: str
    note: str


HELPLINES = (
    Helpline("安心專線", "1925", "24 小時"),
    Helpline("生命線", "1995", "24 小時"),
    Helpline("張老師專線", "1980", ""),
    Helpline("緊急求助", "119／110", "有立即危險時"),
)

# Common self-harm phrasings (Traditional / Simplified Chinese and English).
# Prefer showing helplines too often over missing someone who needs them.
_SELF_HARM = re.compile(
    r"自殺|自杀|輕生|轻生|想死|不想活|活不下去|活著好累|活着好累|結束(自己的)?生命|结束(自己的)?生命"
    r"|了結自己|了结自己|自殘|自残|割腕|傷害自己|伤害自己|跳樓|跳楼|尋死|寻死|一了百了|消失算了"
    r"|suicid|kill myself|self[- ]?harm|end my life",
    re.IGNORECASE,
)


def mentions_self_harm(text: str) -> bool:
    return bool(_SELF_HARM.search(text))
