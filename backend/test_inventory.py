from main import calculate_spoilage_risk

def test_low_risk():
    risk = calculate_spoilage_risk(avg_temp=22, humidity=50, chance_of_rain=10, month=5, category='frozen')
    assert risk < 3

def test_moderate_risk():
    risk = calculate_spoilage_risk(avg_temp=28, humidity=65, chance_of_rain=45, month=4, category='fruit')
    assert 3 <= risk < 6

def test_high_risk():
    risk = calculate_spoilage_risk(avg_temp=32, humidity=80, chance_of_rain=80, month=8, category='vegetable')
    assert risk >= 6
