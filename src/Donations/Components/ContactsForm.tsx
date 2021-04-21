import React, { ReactElement } from "react";
import MaterialTextField from "../../Common/InputTypes/MaterialTextField";
import AutoCompleteCountry from "../../Common/InputTypes/AutoCompleteCountry";
import { useTranslation } from "next-i18next";
import { Controller, useForm } from "react-hook-form";
import { QueryParamContext } from "../../Layout/QueryParamContext";
import ToggleSwitch from "../../Common/InputTypes/ToggleSwitch";
import COUNTRY_ADDRESS_POSTALS from "./../../Utils/countryZipCode";
import BackButton from "../../../public/assets/icons/BackButton";
interface Props {}

function ContactsForm({}: Props): ReactElement {
  const { t } = useTranslation("common");

  const [isCompany, setIsCompany] = React.useState(false);
  const [isTaxDeductible, setIsTaxDeductible] = React.useState(false);
  const {
    contactDetails,
    setContactDetails,
    setdonationStep,
  } = React.useContext(QueryParamContext);


  React.useEffect(()=>{
    if(contactDetails){
      reset(contactDetails);
      if(contactDetails.companyName){
        setIsCompany(true)
      }
    }
  },[contactDetails])

  const { register, errors, handleSubmit, control, reset } = useForm({
    mode: "all",
    defaultValues: {},
  });


  const defaultCountry = isTaxDeductible ? country : "IN";

  React.useEffect(() => {
    const fiteredCountry = COUNTRY_ADDRESS_POSTALS.filter(
      (country) => country.abbrev === contactDetails.country
    );
    setPostalRegex(fiteredCountry[0]?.postal);
  }, [contactDetails.country]);

  const onSubmit = (data: any) => {
    setContactDetails(data)
    setdonationStep(3)
  };

  const [postalRegex, setPostalRegex] = React.useState(
    COUNTRY_ADDRESS_POSTALS.filter(
      (country) => country.abbrev === contactDetails.country
    )[0]?.postal
  );

  return (
    <div className={"donations-forms-container"}>
      <div className="donations-form">
        <button onClick={() => setdonationStep(1)} className="mb-10">
          <BackButton />
        </button>
        {/* <button className="login-continue">{t("loginContinue")}</button> */}
        <p className="title-text">{t("contactDetails")}</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="d-flex row">
            <div className={"form-field mt-20 flex-1"}>
              <MaterialTextField
                inputRef={register({ required: true })}
                label={t("firstName")}
                variant="outlined"
                name="firstname"
                defaultValue={contactDetails.firstname}
              />
              {errors.firstname && (
                <span className={"form-errors"}>{t("firstNameRequired")}</span>
              )}
            </div>
            <div style={{ width: "20px" }} />
            <div className={"form-field mt-20 flex-1"}>
              <MaterialTextField
                inputRef={register({ required: true })}
                label={t("lastName")}
                variant="outlined"
                name="lastname"
                defaultValue={contactDetails.lastname}
              />
              {errors.lastname && (
                <span className={"form-errors"}>{t("lastNameRequired")}</span>
              )}
            </div>
          </div>

          <div className={"form-field mt-30"}>
            <MaterialTextField
              inputRef={register({
                required: true,
                pattern: /^([a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)$/i,
              })}
              label={t("email")}
              variant="outlined"
              name="email"
              defaultValue={contactDetails.email}
            />
            {errors.email && (
              <span className={"form-errors"}>{t("emailRequired")}</span>
            )}
          </div>

          <div className={"form-field mt-30"}>
            <MaterialTextField
              inputRef={register({ required: true })}
              label={t("address")}
              variant="outlined"
              name="address"
              defaultValue={contactDetails.address}
            />
            {errors.address && (
              <span className={"form-errors"}>{t("addressRequired")}</span>
            )}
          </div>

          <div className={"d-flex row"}>
            <div className={"form-field mt-30 flex-1"}>
              <MaterialTextField
                inputRef={register({ required: true })}
                label={t("city")}
                variant="outlined"
                name="city"
                defaultValue={contactDetails.city}
              />
              {errors.city && (
                <span className={"form-errors"}>{t("cityRequired")}</span>
              )}
            </div>
            <div style={{ width: "20px" }} />
            <div className={"form-field mt-30 flex-1"}>
              {true && (
                <MaterialTextField
                  inputRef={register({
                    required: true,
                    pattern: postalRegex,
                  })}
                  label={t("zipCode")}
                  variant="outlined"
                  name="zipCode"
                  defaultValue={contactDetails.zipCode}
                />
              )}
              {errors.zipCode && (
                <span className={"form-errors"}>
                  {t("zipCodeAlphaNumValidation")}
                </span>
              )}
            </div>
          </div>

          <div className={"form-field mt-30"}>
            <Controller
              control={control}
              rules={{
                required: {
                  value: true,
                  message: t("countryRequired"),
                },
              }}
              name="country"
              render={({ onChange, onBlur, value, name, ref }) => (
                <AutoCompleteCountry
                  inputRef={ref}
                  label={t("country")}
                  name="country"
                  onChange={(data: any) => {
                    onChange(data);
                  }}
                  defaultValue={
                    contactDetails.country
                      ? contactDetails.country
                      : defaultCountry
                  }
                />
              )}
            />

            {errors.country && (
              <span className={"form-errors"}>{t("countryRequired")}</span>
            )}
          </div>

          <div className="contacts-isCompany-toggle mt-20">
            <label htmlFor="isCompany-toggle">
              {t("isACompanyDonation")}
              <span
                className={"isCompanyText"}
                style={{ fontSize: "12px", fontStyle: "italic" }}
              >
                {isTaxDeductible
                  ? t("orgNamePublishedTax")
                  : t("orgNamePublished")}
              </span>
            </label>
            <ToggleSwitch
              name="isCompany-toggle"
              checked={isCompany}
              onChange={() => setIsCompany(!isCompany)}
              id="isCompany-toggle"
            />
          </div>

          {isCompany ? (
            <div className={"form-field mt-20"}>
              <MaterialTextField
                label={t("companyName")}
                name="companyname"
                variant="outlined"
                inputRef={
                  isCompany ? register({ required: true }) : register({})
                }
                defaultValue={contactDetails.companyname}
              />
              {errors.companyname && (
                <span className={"form-errors"}>{t("companyRequired")}</span>
              )}
            </div>
          ) : null}

          {errors.firstname ||
          errors.lastname ||
          errors.email ||
          errors.address ||
          errors.city ||
          errors.zipCode ||
          errors.country ? (
            <button className={"secondary-button mt-30"}>
              {t("continue")}
            </button>
          ) : (
            <button
              onClick={handleSubmit(onSubmit)}
              className={"primary-button mt-30"}
              style={{ borderRadius: "10px" }}
            >
              {t("continue")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default ContactsForm;