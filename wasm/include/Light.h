#ifndef LIGHT_H
#define LIGHT_H

#include<stdint.h>

class Light
{
    public:
    uint8_t r = 1, g = 2, b = 3;

    void init(uint8_t Rd, uint8_t Gn, uint8_t Bu)
    {
        r = Rd; g = Gn; b = Bu;
    }
    Light(uint8_t Rd, uint8_t Gn, uint8_t Bu) { init(Rd, Gn, Bu); }
    Light() {}
    Light(float fr, float fg, float fb) {
        r = (uint8_t)(fr < 0 ? 0 : (fr > 255 ? 255 : fr));
        g = (uint8_t)(fg < 0 ? 0 : (fg > 255 ? 255 : fg));
        b = (uint8_t)(fb < 0 ? 0 : (fb > 255 ? 255 : fb));
    }

    bool operator == (const Light &Lt) const
    {
        if (r != Lt.r || g != Lt.g || b != Lt.b) return false;
        return true;
    }
    bool operator != (const Light &Lt) const
    {

        return !(*this == Lt);
    }
};

#endif // LIGHT_H
