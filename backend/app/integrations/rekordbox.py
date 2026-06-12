import xml.etree.ElementTree as ET
from typing import List
from datetime import datetime


def export_playlist_to_rekordbox_xml(playlist_name: str, tracks: list) -> str:
    root = ET.Element("DJ_PLAYLISTS", Version="1.0.0")
    product = ET.SubElement(root, "PRODUCT", Name="Setrya", Version="1.0.0", Company="Setrya")

    collection = ET.SubElement(root, "COLLECTION", Entries=str(len(tracks)))
    for i, track in enumerate(tracks):
        track_el = ET.SubElement(
            collection, "TRACK",
            TrackID=str(i + 1),
            Name=track.title or "",
            Artist=track.artist or "",
            Album=track.album or "",
            TotalTime=str(int((track.duration_ms or 0) / 1000)),
            AverageBpm=str(round(track.bpm or 0, 2)),
            Tonality=track.key_standard or "",
            Genre=track.genre or "",
            Location=f"file://localhost{track.file_path}" if track.file_path else "",
        )
        if track.mix_in_point is not None:
            ET.SubElement(
                track_el, "POSITION_MARK",
                Name="Mix In",
                Type="0",
                Start=str(round(track.mix_in_point / 1000, 3)),
                Num="0",
            )
        if track.mix_out_point is not None:
            ET.SubElement(
                track_el, "POSITION_MARK",
                Name="Mix Out",
                Type="0",
                Start=str(round(track.mix_out_point / 1000, 3)),
                Num="1",
            )
        if track.cue_points:
            for j, cue_ms in enumerate(track.cue_points[:8]):
                ET.SubElement(
                    track_el, "POSITION_MARK",
                    Name=f"Cue {j+1}",
                    Type="0",
                    Start=str(round(cue_ms / 1000, 3)),
                    Num=str(j + 2),
                )

    playlists = ET.SubElement(root, "PLAYLISTS")
    root_node = ET.SubElement(playlists, "NODE", Type="0", Name="ROOT", Count="1")
    playlist_node = ET.SubElement(
        root_node, "NODE",
        Name=playlist_name,
        Type="1",
        KeyType="0",
        Entries=str(len(tracks)),
    )
    for i in range(len(tracks)):
        ET.SubElement(playlist_node, "TRACK", Key=str(i + 1))

    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="unicode", xml_declaration=True)
