import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import 'app_pages.dart';

class PinPlaceFlow extends StatefulWidget {
  const PinPlaceFlow({
    super.key,
    required this.onCancel,
    required this.onSaved,
  });

  final VoidCallback onCancel;
  final VoidCallback onSaved;

  @override
  State<PinPlaceFlow> createState() => _PinPlaceFlowState();
}

class _PinPlaceFlowState extends State<PinPlaceFlow> {
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();
  int _step = 0;
  int _selectedType = 1;
  double _radius = 500;
  GoogleMapController? _mapController;
  LatLng _selectedPosition = const LatLng(18.7883, 98.9853);
  bool _locationGranted = false;
  String? _locationError;
  final Set<String> _watchTopics = {
    'ฝนตกหนัก',
    'น้ำท่วม',
    'PM2.5',
    'ประกาศสำคัญ',
    'แผ่นดินไหว',
  };

  static const _types = [
    ('บ้าน', 'home'),
    ('โรงเรียน', 'school'),
    ('ที่ทำงาน', 'office'),
    ('ตลาด', 'market'),
    ('ห้างสรรพสินค้า', 'mall'),
    ('ร้านค้า', 'convenience'),
    ('โรงพยาบาล', 'hospital'),
    ('วัด', 'temple'),
    ('สวนสาธารณะ', 'park'),
    ('โรงงาน', 'factory'),
    ('ปั๊มน้ำมัน', 'gas'),
    ('คลังสินค้า', 'warehouse'),
    ('โรงแรม', 'hotel'),
    ('ร้านอาหาร', 'restaurant'),
    ('คาเฟ่', 'cafe'),
    ('ชายหาด', 'beach'),
    ('สนามกีฬา', 'stadium'),
    ('สนามบิน', 'airport'),
  ];

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _next() {
    if (_step == 0 && _nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('กรุณาระบุชื่อสถานที่')));
      return;
    }
    if (_step < 2) {
      setState(() => _step++);
    } else {
      widget.onSaved();
    }
  }

  Future<void> _loadCurrentLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        if (mounted) {
          setState(() => _locationError = 'กรุณาเปิดบริการตำแหน่งบนอุปกรณ์');
        }
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) {
          setState(() => _locationError = 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final current = LatLng(position.latitude, position.longitude);
      if (!mounted) return;
      setState(() {
        _selectedPosition = current;
        _locationGranted = true;
        _locationError = null;
      });
      await _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(current, 15.5),
      );
    } catch (_) {
      if (mounted) {
        setState(() => _locationError = 'อ่านตำแหน่งไม่สำเร็จ');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        leading: IconButton(
          onPressed: _step == 0
              ? widget.onCancel
              : () => setState(() => _step--),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: const Text(
          'ปักหมุดสถานที่ใหม่',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _step == 2 ? widget.onSaved : null,
            child: const Text('บันทึก'),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            _StepHeader(step: _step),
            Expanded(
              child: IndexedStack(
                index: _step,
                children: [
                  _DetailsStep(
                    nameController: _nameController,
                    addressController: _addressController,
                    noteController: _noteController,
                    selectedType: _selectedType,
                    onSelectType: (index) {
                      setState(() => _selectedType = index);
                    },
                    onShowAll: _showAllTypes,
                  ),
                  _LocationStep(
                    radius: _radius,
                    selectedPosition: _selectedPosition,
                    locationGranted: _locationGranted,
                    locationError: _locationError,
                    onMapCreated: (controller) {
                      _mapController = controller;
                    },
                    onPositionChanged: (position) {
                      setState(() => _selectedPosition = position);
                    },
                    onMyLocation: _loadCurrentLocation,
                    onRadiusChanged: (value) {
                      setState(() => _radius = value);
                    },
                  ),
                  _WatchSettingsStep(
                    selectedTopics: _watchTopics,
                    onChanged: (topic, selected) {
                      setState(() {
                        selected
                            ? _watchTopics.add(topic)
                            : _watchTopics.remove(topic);
                      });
                    },
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 16),
              child: FilledButton(
                onPressed: _next,
                style: FilledButton.styleFrom(
                  backgroundColor: green,
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _step == 2 ? 'บันทึกสถานที่' : 'ต่อไป',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllTypes() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      showDragHandle: true,
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: .68,
          maxChildSize: .9,
          builder: (context, controller) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 12, 12),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'เลือกประเภทสถานที่',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: Navigator.of(context).pop,
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: GridView.builder(
                    controller: controller,
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 10,
                          childAspectRatio: .82,
                        ),
                    itemCount: _types.length,
                    itemBuilder: (context, index) {
                      return _TypeTile(
                        item: _types[index],
                        selected: index == _selectedType,
                        onTap: () {
                          setState(() => _selectedType = index);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    const labels = ['ข้อมูลสถานที่', 'เลือกตำแหน่ง', 'ตั้งค่าการเฝ้าระวัง'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 14),
      child: Row(
        children: List.generate(3, (index) {
          final done = index < step;
          final active = index == step;
          return Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    if (index > 0)
                      Expanded(
                        child: Divider(
                          color: done || active ? brightGreen : line,
                        ),
                      ),
                    Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: done || active
                            ? brightGreen
                            : const Color(0xFFC5CBD1),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: done
                            ? const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 18,
                              )
                            : Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                    if (index < 2)
                      Expanded(
                        child: Divider(
                          color: index < step ? brightGreen : line,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  labels[index],
                  maxLines: 1,
                  style: TextStyle(
                    fontSize: 11,
                    color: active ? ink : muted,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _DetailsStep extends StatelessWidget {
  const _DetailsStep({
    required this.nameController,
    required this.addressController,
    required this.noteController,
    required this.selectedType,
    required this.onSelectType,
    required this.onShowAll,
  });

  final TextEditingController nameController;
  final TextEditingController addressController;
  final TextEditingController noteController;
  final int selectedType;
  final ValueChanged<int> onSelectType;
  final VoidCallback onShowAll;

  @override
  Widget build(BuildContext context) {
    const visibleTypes = [
      ('บ้าน', 'home'),
      ('โรงเรียน', 'school'),
      ('ที่ทำงาน', 'office'),
      ('ตลาด', 'market'),
      ('ห้างฯ', 'mall'),
      ('ร้านค้า', 'convenience'),
      ('โรงพยาบาล', 'hospital'),
    ];
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 0, 18, 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: line),
          boxShadow: const [
            BoxShadow(color: Color(0x10000000), blurRadius: 12),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _FieldLabel('ชื่อสถานที่'),
            const SizedBox(height: 7),
            TextField(
              controller: nameController,
              maxLength: 50,
              decoration: _inputDecoration(
                'เช่น บ้าน, โรงเรียน, ที่ทำงาน',
                Icons.location_on_outlined,
              ),
            ),
            const SizedBox(height: 8),
            const _FieldLabel('ประเภทสถานที่'),
            const SizedBox(height: 9),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 9,
                crossAxisSpacing: 9,
                childAspectRatio: .76,
              ),
              itemCount: 8,
              itemBuilder: (context, index) {
                if (index == 7) {
                  return InkWell(
                    onTap: onShowAll,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: line),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircleAvatar(
                            backgroundColor: Color(0xFFE7EBEE),
                            child: Icon(Icons.more_horiz, color: muted),
                          ),
                          SizedBox(height: 5),
                          Text('อื่นๆ', style: TextStyle(fontSize: 11)),
                        ],
                      ),
                    ),
                  );
                }
                return _TypeTile(
                  item: visibleTypes[index],
                  selected: index == selectedType,
                  onTap: () => onSelectType(index),
                );
              },
            ),
            const SizedBox(height: 18),
            const _FieldLabel('ที่อยู่ (ไม่บังคับ)'),
            const SizedBox(height: 7),
            TextField(
              controller: addressController,
              maxLength: 120,
              decoration: _inputDecoration(
                'เช่น เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ',
                Icons.location_on_outlined,
              ),
            ),
            const _FieldLabel('หมายเหตุ (ไม่บังคับ)'),
            const SizedBox(height: 7),
            TextField(
              controller: noteController,
              maxLength: 200,
              decoration: _inputDecoration(
                'เพิ่มรายละเอียดเพิ่มเติม...',
                Icons.edit_note_rounded,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeTile extends StatelessWidget {
  const _TypeTile({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final (String, String) item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFF1FBF4) : surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? brightGreen : line),
        ),
        child: Column(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(11),
                ),
                child: Image.asset(
                  'assets/images/place_types/${item.$2}.png',
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Text(
                item.$1,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LocationStep extends StatelessWidget {
  const _LocationStep({
    required this.radius,
    required this.selectedPosition,
    required this.locationGranted,
    required this.locationError,
    required this.onMapCreated,
    required this.onPositionChanged,
    required this.onMyLocation,
    required this.onRadiusChanged,
  });

  final double radius;
  final LatLng selectedPosition;
  final bool locationGranted;
  final String? locationError;
  final ValueChanged<GoogleMapController> onMapCreated;
  final ValueChanged<LatLng> onPositionChanged;
  final VoidCallback onMyLocation;
  final ValueChanged<double> onRadiusChanged;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: GoogleMap(
            initialCameraPosition: CameraPosition(
              target: selectedPosition,
              zoom: 15.5,
            ),
            onMapCreated: onMapCreated,
            onTap: onPositionChanged,
            mapToolbarEnabled: false,
            zoomControlsEnabled: false,
            compassEnabled: false,
            myLocationEnabled: locationGranted,
            myLocationButtonEnabled: false,
            markers: {
              Marker(
                markerId: const MarkerId('selected-place'),
                position: selectedPosition,
                draggable: true,
                onDragEnd: onPositionChanged,
              ),
            },
            circles: {
              Circle(
                circleId: const CircleId('watch-radius'),
                center: selectedPosition,
                radius: radius,
                fillColor: brightGreen.withValues(alpha: .14),
                strokeColor: brightGreen,
                strokeWidth: 2,
              ),
            },
          ),
        ),
        Positioned(
          top: 12,
          left: 18,
          right: 18,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: const [
                BoxShadow(color: Color(0x19000000), blurRadius: 12),
              ],
            ),
            child: TextField(
              readOnly: true,
              decoration: InputDecoration(
                border: InputBorder.none,
                icon: const Icon(Icons.touch_app_outlined, color: muted),
                hintText: 'แตะบนแผนที่เพื่อเลือกตำแหน่ง',
                suffixIcon: IconButton(
                  onPressed: onMyLocation,
                  icon: const Icon(Icons.my_location_rounded, color: ink),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 18,
          right: 18,
          bottom: 12,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(16, 13, 16, 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: const [
                    BoxShadow(color: Color(0x17000000), blurRadius: 14),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ปรับขนาดพื้นที่เฝ้าระวัง',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Center(
                      child: Text(
                        'รัศมี ${radius.round()} เมตร',
                        style: const TextStyle(
                          color: brightGreen,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Slider(
                      value: radius,
                      min: 100,
                      max: 2000,
                      divisions: 19,
                      activeColor: brightGreen,
                      onChanged: onRadiusChanged,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(13),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: line),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_rounded, color: brightGreen),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ตำแหน่งที่เลือก',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            locationError ??
                                '${selectedPosition.latitude.toStringAsFixed(6)}, '
                                    '${selectedPosition.longitude.toStringAsFixed(6)}',
                            style: TextStyle(
                              color: locationError == null
                                  ? muted
                                  : Colors.orange,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: onMyLocation,
                      icon: const Icon(Icons.my_location_rounded, color: ink),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _WatchSettingsStep extends StatelessWidget {
  const _WatchSettingsStep({
    required this.selectedTopics,
    required this.onChanged,
  });

  final Set<String> selectedTopics;
  final void Function(String, bool) onChanged;

  @override
  Widget build(BuildContext context) {
    const topics = [
      (Icons.thunderstorm_outlined, 'ฝนตกหนัก'),
      (Icons.waves_rounded, 'น้ำท่วม'),
      (Icons.blur_on_rounded, 'PM2.5'),
      (Icons.campaign_outlined, 'ประกาศสำคัญ'),
      (Icons.vibration_rounded, 'แผ่นดินไหว'),
    ];
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 4, 18, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'อยากให้เราเฝ้าเรื่องอะไรบ้าง',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 5),
          const Text('เปิดเฉพาะสิ่งที่สำคัญสำหรับสถานที่นี้'),
          const SizedBox(height: 18),
          ...topics.map((topic) {
            final selected = selectedTopics.contains(topic.$2);
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: line),
              ),
              child: SwitchListTile(
                value: selected,
                activeThumbColor: brightGreen,
                onChanged: (value) => onChanged(topic.$2, value),
                secondary: Icon(topic.$1, color: green),
                title: Text(
                  topic.$2,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text(
                  'แจ้งเตือนเมื่อมีเหตุการณ์สำคัญจริง ๆ',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FAF3),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Row(
              children: [
                Icon(Icons.lightbulb_outline, color: green),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'คุณเปลี่ยนหัวข้อเฝ้าระวังภายหลังได้เสมอ',
                    style: TextStyle(color: ink),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(color: ink, fontWeight: FontWeight.w700),
    );
  }
}

InputDecoration _inputDecoration(String hint, IconData icon) {
  return InputDecoration(
    hintText: hint,
    prefixIcon: Icon(icon, color: muted),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: const BorderSide(color: line),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(13),
      borderSide: const BorderSide(color: brightGreen, width: 1.5),
    ),
  );
}
