async function triggerSneakAttackSuccessEffects\" in line:\
        found = i\
        break\
\
if found >= 0:\
    print(\"Found at line:\", found + 1)\
    for j in range(max(0, found - 2), min(len(lines), found + 15)):\
        print(f\"{j+1}