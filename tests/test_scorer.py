from scorer import estimate_ai_percentage


def test_estimate_ai_percentage_range():
    score = estimate_ai_percentage("This is a short, casual post. I think we should vote yes.")
    assert 0 <= score <= 100


def test_estimate_ai_percentage_empty():
    assert estimate_ai_percentage("") == 0.0
