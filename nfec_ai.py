# nfec_ai.py — The "Brain Core" Instruction Resolver
# v2.0 AI-Driven Intent Decomposition

import re

# 1. ATOMIC ROBOT ACTIONS
ACTIONS = ["brew_coffee", "dim_lights", "activate_focus", "return_home", "pick_up", "deploy_arm"]

# 2. SEMANTIC KNOWLEDGE BASE (Synonyms and Intent Clusters)
INTENT_MAP = {
    "brew_coffee": ["drink", "beverage", "energy", "caffeine", "latte", "coffee", "wake me up", "thirsty"],
    "dim_lights": ["dark", "cozy", "night", "sleep", "evening", "soothe", "low light", "study mode", "less bright"],
    "activate_focus": ["work", "exam", "deep work", "concentrate", "productive", "do not disturb", "silence", "study"],
    "return_home": ["stop", "reset", "dock", "base", "finish", "done", "normal", "original position", "recharge"],
    "pick_up": ["grab", "take", "collect", "hold", "carry", "get that", "capture"],
    "deploy_arm": ["manipulate", "use arm", "伸", "touch", "interact", "hand", "reach"]
}

# 3. COMPLEX CONTEXTUAL REASONING
# Maps abstract "feelings" to multiple atomic actions
CONTEXT_REASONER = {
    "tired": ["dim_lights", "activate_focus"],
    "morning": ["brew_coffee", "return_home"],
    "party": ["brew_coffee", "dim_lights"], # Robot brews coffee for guests?
    "grind": ["activate_focus", "brew_coffee"]
}

def resolve_intent(user_input):
    """
    Takes arbitrary user input and decomposes it into a sequence of robot actions.
    No fixed instructions required.
    """
    input_str = user_input.lower().strip()
    resolved_actions = []

    # A. Check for Contextual Phrases (Reasoning)
    for context, actions in CONTEXT_REASONER.items():
        if context in input_str:
            resolved_actions.extend(actions)

    # B. Decomposition & Semantic Mapping
    # Identify individual action keywords or their synonyms
    for action, synonyms in INTENT_MAP.items():
        if action in input_str:
            resolved_actions.append(action)
        else:
            for syn in synonyms:
                if syn in input_str:
                    resolved_actions.append(action)
                    break 

    # C. Dedup and Clean
    final_sequence = list(dict.fromkeys(resolved_actions))
    
    if not final_sequence:
        return "I'm not sure how to handle that intent. Please try something like 'I'm feeling tired' or 'make some coffee'.", []

    msg = f"AI RESOLVER: Interpreted intent as: {final_sequence}"
    return msg, final_sequence

if __name__ == "__main__":
    # Local Test
    test_inputs = [
        "I am really tired right now",
        "Can you get me a drink?",
        "Time for some deep work",
        "Make it dark and then return to base",
        "Reset everything"
    ]
    for i in test_inputs:
        msg, actions = resolve_intent(i)
        print(f"INPUT: '{i}'\nRESULT: {msg}\n")
